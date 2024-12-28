import { forwardRef, useMemo } from "react";
import * as THREE from "three";
import { Font } from "three/examples/jsm/loaders/FontLoader.js";
import { TextOptions } from "../types/text";
import {
    createCubeMaterial,
    createMeshBasicMaterialFromOption
} from "../utils/textMaterial.ts";
import { createSpacedTextGeometry, createSpacedTextGeometryOutline } from "../utils/textGeometry.ts";

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
    const boundingBox: THREE.Box3 = new THREE.Box3().setFromObject(new THREE.Mesh(geometry));

    // 创建文字材质
    const textMaterial = useMemo(() =>
        createCubeMaterial(
            opts.materials,
            boundingBox,
            globalTextureYOffset
        ),
        [opts.materials, boundingBox, globalTextureYOffset]
    );

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

    const outlineMaterial = useMemo(() =>
            createMeshBasicMaterialFromOption(opts.materials.outline, false, [1, 1], [1, 1], [0, 0], { side: THREE.BackSide }),
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

    // 创建主网格
    const mainMesh = useMemo(() => new THREE.Mesh(geometry, textMaterial), [geometry, textMaterial]);
    const outlineMesh = useMemo(() => new THREE.Mesh(geometryOutline, outlineMaterial), [geometryOutline, outlineMaterial]);

    // 创建一个组包含主网格
    const group = useMemo(() => {
        const grp = new THREE.Group();
        grp.add(mainMesh);
        grp.add(outlineMesh);
        grp.position.set(...position);
        grp.rotation.set(...rotation);
        return grp;
    }, [mainMesh, outlineMesh, position, rotation]);

    return <primitive object={group} ref={ref} />;
});

export default Text3D;