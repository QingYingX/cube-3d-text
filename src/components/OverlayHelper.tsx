import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { Font } from "three/examples/jsm/loaders/FontLoader.js";
import { TextOptions } from "../types/text";
import { createTextShapes2D } from "../utils/textGeometry";
import { OverlayRenderer } from "../utils/overlay";

interface OverlayHelperProps {
    boundingBox: THREE.Box3;
    content: string;
    opts: TextOptions;
    font: Font;
    setOverlayMaterial: (material: THREE.Material[]) => void;
}

const OverlayHelper: React.FC<OverlayHelperProps> = (props) => {
    const { boundingBox, content, opts, font, setOverlayMaterial } = props;

    const canvasRef = useRef<HTMLCanvasElement>(null);
    
    const overlayRenderer: OverlayRenderer = opts.overlay!.renderer;

    const overlayCanvasWidthPercent = useMemo(
        () => (boundingBox.max.x - boundingBox.min.x) / (boundingBox.max.y - boundingBox.min.y),
        [boundingBox]
    );

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
        const scaleX = (canvas.width) / totalWidth;
        const scaleY = (canvas.height) / totalHeight;
        const scale = Math.min(scaleX, scaleY);

        // 应用变换
        ctx.save();
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.scale(scale, -scale); // Y轴翻转
        ctx.translate(-totalWidth / 2, -totalHeight / 2);

        // 绘制overlay
        overlayRenderer(ctx, shapes, canvas.width / scale, canvas.height / scale);

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
        canvasTexture.magFilter = THREE.NearestFilter;
        canvasTexture.minFilter = THREE.NearestFilter;
        canvasTexture.colorSpace = THREE.SRGBColorSpace;
        // 创建新的混合材质
        const blendedMaterial = new THREE.MeshBasicMaterial({
            map: canvasTexture,
            transparent: true,
            opacity: 1,
            side: THREE.FrontSide,
            blending: THREE.NormalBlending
        });
        cubeMaterial[4] = blendedMaterial;

        ctx.restore();

        setOverlayMaterial(cubeMaterial);
    }, [boundingBox, content, font, opts.letterSpacing, opts.spacingWidth, overlayRenderer, setOverlayMaterial]);

    return <canvas ref={canvasRef} width={overlayCanvasWidthPercent * 200} height="200" style={{ background: 'black' }}></canvas>
};

export default OverlayHelper;