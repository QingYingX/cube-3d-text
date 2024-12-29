import { forwardRef, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { Font } from "three/examples/jsm/loaders/FontLoader.js";
import { TextOptions } from "../types/text";
import {
    createCubeMaterial,
    createMeshBasicMaterialFromOption
} from "../utils/textMaterial.ts";
import { assignFrontUV, createSpacedTextGeometry, createSpacedTextGeometryOutline, createTextShapes2D, shapeToCanvasPath } from "../utils/textGeometry.ts";
import { Html } from "@react-three/drei";

interface Text3DProps {
    content: string;
    opts: TextOptions;
    font: Font;
    globalTextureYOffset: number;
    position: [number, number, number];
    rotation: [number, number, number];
}

const Text3D = forwardRef<THREE.Group, Text3DProps>(({
                                                         content,
                                                         opts,
                                                         font,
                                                         globalTextureYOffset,
                                                         position,
                                                         rotation
                                                     }, ref) => {

    // 创建带有字间距的文字几何体
    const geometry = useMemo(() => {
        if (!content) {
            return new THREE.BufferGeometry();
        }
        return createSpacedTextGeometry({
            text: content,
            font,
            size: opts.size,
            height: opts.depth,
            curveSegments: 12,
            bevelEnabled: false,
            letterSpacing: opts.letterSpacing,
            spacingWidth: opts.spacingWidth
        });
    }, [content, opts.size, opts.depth, font, opts.letterSpacing, opts.spacingWidth]);

    // 获取文字几何体的高度
    const boundingBox = useMemo(() => {
        const box = new THREE.Box3();
        const mesh = new THREE.Mesh(geometry);
        return box.setFromObject(mesh);
    }, [geometry]);

    const overlayCanvasWidthPercent = useMemo(() => {
        return (boundingBox.max.x - boundingBox.min.x) / (boundingBox.max.y - boundingBox.min.y);
    }, [boundingBox]);

    const canvasRef = useRef<HTMLCanvasElement>(null);

    // 创建文字材质
    const textMaterial = useMemo(() => 
        createCubeMaterial(
            opts.materials,
            boundingBox,
            globalTextureYOffset
        ),
        [opts.materials, boundingBox, globalTextureYOffset]);

    const height = boundingBox.max.y - boundingBox.min.y;

    const geometryOutline = useMemo(() => {
        if (!content) {
            return new THREE.BufferGeometry();
        }
        return createSpacedTextGeometryOutline({
            text: content,
            font,
            size: opts.size,
            height: opts.depth,
            outlineWidth: opts.outlineWidth * (height / 10),
            curveSegments: 12,
            bevelEnabled: false,
            letterSpacing: opts.letterSpacing,
            spacingWidth: opts.spacingWidth
        });
    }, [content, opts.size, opts.depth, font, opts.letterSpacing, opts.spacingWidth, opts.outlineWidth, height]);

    const outlineMaterial = useMemo(
        () => createMeshBasicMaterialFromOption(opts.materials.outline, false, [1, 1], [1, 1], [0, 0], { side: THREE.BackSide, depthTest: false }),
        //createLinePointMaterial(),
        [opts.materials]
    );

    // 分组几何体
    useMemo(() => {
        const positionAttribute = geometry.getAttribute('position') as THREE.BufferAttribute;
        const normalAttribute = geometry.getAttribute('normal') as THREE.BufferAttribute;

        if (!positionAttribute) {
            return;
        }

        const groups = [];
        for (let i = 0; i < positionAttribute.count; i += 3) {
            const normal = new THREE.Vector3(
                normalAttribute.getX(i),
                normalAttribute.getY(i),
                normalAttribute.getZ(i)
            ).normalize();

            let groupIndex = 4; // 默认前后面

            // 根据法线方向分配组索引
            if (Math.abs(normal.x) > 0.8) {
                groupIndex = normal.x > 0 ? 0 : 1; // 右面或左面
            } else if (Math.abs(normal.y) > 0.5) {
                groupIndex = normal.y > 0 ? 2 : 3; // 上面或下面
            }

            groups.push({
                start: i,
                count: 3,
                materialIndex: groupIndex
            });
        }

        // 清现有组
        while (geometry.groups.length > 0) {
            geometry.groups.pop();
        }

        // 添加新组
        groups.forEach(group => geometry.addGroup(group.start, group.count, group.materialIndex));

    }, [geometry]);

    // 主网格
    const mainMesh = useMemo(() => {
        const mesh = new THREE.Mesh(geometry, textMaterial);
        mesh.renderOrder = 2;
        return mesh;
    }, [geometry, textMaterial]);

    // 描边网格
    const outlineMesh = useMemo(() => {
        const mesh = new THREE.Mesh(geometryOutline, outlineMaterial);
        mesh.renderOrder = 1;
        return mesh;
    }, [geometryOutline, outlineMaterial]);

    const [overlayMaterial, setOverlayMaterial] = useState<THREE.Material[]>();

    // overlay 材质
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) {
            console.log('no canvas');
            return;
        }
        if (!font) {
            console.log('no font');
            return;
        }
        const ctx = canvas.getContext("2d");
        if (!ctx || !content) {
            console.log('no ctx or content');
            return;
        }

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const { shapes, totalWidth, totalHeight } = createTextShapes2D({
            text: content,
            font,
            letterSpacing: opts.letterSpacing,
            spacingWidth: opts.spacingWidth,
        });

        // 计算缩放比例
        const padding = 0; // 边距
        const scaleX = (canvas.width - padding * 2) / totalWidth;
        const scaleY = (canvas.height - padding * 2) / totalHeight;
        const scale = Math.min(scaleX, scaleY);

        // 应用变换
        ctx.save();
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.scale(scale, -scale); // Y轴翻转
        ctx.translate(-totalWidth / 2, -totalHeight / 2);

        // 4. 绘制文本
        ctx.fillStyle = "#000";
        shapes.forEach((shape) => {
            const path = shapeToCanvasPath(shape);
            ctx.fill(path, 'evenodd'); // 使用 evenodd 规则处理孔洞
        });

        // 创建材质的步骤
        const cubeMaterial = Array(6).fill(null).map(() =>
            new THREE.MeshBasicMaterial({
                color: 0x000000,
                transparent: true,
                opacity: 0,
                side: THREE.FrontSide
            })
        );

        const canvasTexture = new THREE.CanvasTexture(canvas);
        canvasTexture.needsUpdate = true;
        // 创建 canvas 纹理
        // 设置纹理重复
        canvasTexture.repeat.set(1, 1);
        canvasTexture.wrapS = THREE.RepeatWrapping;
        canvasTexture.wrapT = THREE.RepeatWrapping;
        // 创建新的混合材质
        const blendedMaterial = new THREE.MeshBasicMaterial({
            map: canvasTexture,
            transparent: true,
            opacity: 1,
            side: THREE.FrontSide,
        });
        cubeMaterial[4] = blendedMaterial;

        ctx.restore();

        setOverlayMaterial(cubeMaterial);
    }, [content, font, opts.letterSpacing, opts.spacingWidth]);

    // 创建一个组包含主网格
    const group = useMemo(() => {
        const grp = new THREE.Group();
        grp.add(mainMesh);
        // overlayMesh，用于实现overlay的材质
        const overlayMesh = mainMesh.clone();
        overlayMesh.geometry = mainMesh.geometry.clone();
        if (overlayMaterial) overlayMesh.material = overlayMaterial;
        assignFrontUV(overlayMesh.geometry as THREE.BufferGeometry);
        overlayMesh.renderOrder = 3;
        grp.add(overlayMesh);
        grp.add(outlineMesh);
        grp.position.set(...position);
        grp.rotation.set(...rotation);
        return grp;
    }, [mainMesh, outlineMesh, overlayMaterial, position, rotation]);

    return <>
        <primitive object={group} ref={ref} />
        <Html>
            <canvas ref={canvasRef} width={overlayCanvasWidthPercent * 100} height="100"></canvas>
        </Html>
    </>;
});

export default Text3D;