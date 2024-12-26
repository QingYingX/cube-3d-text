// src/components/ThreeCanvas.tsx
import { forwardRef, useImperativeHandle, useEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "@react-three/drei";
import { Canvas, useThree } from "@react-three/fiber";
import { CameraOptions, Text3DData } from "../types/text";
import ThreeScene, { ThreeSceneHandle } from "./ThreeScene.tsx";
import { GLTFExporter, OBJExporter, STLExporter, OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { useMessage } from "../contexts/MessageContext.tsx";

export interface ThreeCanvasHandle {
    takeScreenshot: () => void;
    resetCamera: () => void;
    exportScene: (format: "glb" | "gltf" | "obj" | "stl") => void;
}

interface ThreeCanvasProps {
    cameraOptions: CameraOptions;
    texts: Text3DData[];
    fontUrl: string;
    globalTextureYOffset: number;
}

const CameraController: React.FC<{ fov: number }> = ({ fov }) => {
    const { camera } = useThree();

    useEffect(() => {
        if (camera instanceof THREE.PerspectiveCamera) {
            camera.fov = fov;
            camera.updateProjectionMatrix();
        } else {
            console.warn("当前相机不是 PerspectiveCamera，无法设置 fov");
        }
    }, [fov, camera]);

    return null;
};

interface ScreenshotProps {
    orbitRef: React.RefObject<OrbitControlsImpl>;
}

const ThreeCanvas = forwardRef<ThreeCanvasHandle, ThreeCanvasProps>((props, ref) => {
    const { texts, cameraOptions, fontUrl, globalTextureYOffset } = props;
    const orbitRef = useRef<OrbitControlsImpl>(null);
    const threeSceneRef = useRef<ThreeSceneHandle>(null);
    const messageApi = useMessage();

    // 计算场景 boundingBox 的辅助函数
    const computeScreenBoundingBox = (
        scene: THREE.Scene,
        camera: THREE.Camera,
        gl: THREE.WebGLRenderer
    ) => {
        // 1. 获取场景的包围盒
        const box = new THREE.Box3().setFromObject(scene);

        if (box.isEmpty()) {
            // 如果场景中没有可见对象，直接返回 null
            return null;
        }

        // 2. 将 box 的 8 个角点投影到屏幕
        const corners = [
            new THREE.Vector3(box.min.x, box.min.y, box.min.z),
            new THREE.Vector3(box.min.x, box.min.y, box.max.z),
            new THREE.Vector3(box.min.x, box.max.y, box.min.z),
            new THREE.Vector3(box.min.x, box.max.y, box.max.z),
            new THREE.Vector3(box.max.x, box.min.y, box.min.z),
            new THREE.Vector3(box.max.x, box.min.y, box.max.z),
            new THREE.Vector3(box.max.x, box.max.y, box.min.z),
            new THREE.Vector3(box.max.x, box.max.y, box.max.z),
        ];

        const ndcToScreen = (v: THREE.Vector3, width: number, height: number) => {
            // v 是投影后的 NDC 范围：[-1, 1]
            // 转到屏幕坐标 [0, width], [0, height]
            return {
                x: (v.x + 1) * 0.5 * width,
                y: (-v.y + 1) * 0.5 * height, // 注意 Y 轴翻转
            };
        };

        const { width, height } = gl.getSize(new THREE.Vector2());

        // 投影到屏幕坐标
        const screenPositions = corners.map((corner) => {
            const ndcPos = corner.clone().project(camera); // 世界坐标 => NDC
            return ndcToScreen(ndcPos, width, height);
        });

        const xs = screenPositions.map((p) => p.x);
        const ys = screenPositions.map((p) => p.y);

        const minX = Math.max(Math.floor(Math.min(...xs)), 0);
        const maxX = Math.min(Math.ceil(Math.max(...xs)), width);
        const minY = Math.max(Math.floor(Math.min(...ys)), 0);
        const maxY = Math.min(Math.ceil(Math.max(...ys)), height);

        // 如果越界或无效，也返回 null
        if (maxX <= minX || maxY <= minY) return null;

        return {
            minX,
            minY,
            width: maxX - minX,
            height: maxY - minY,
        };
    };

    // ======== 辅助：下载字符串数据为文件 ========
    function downloadTextData(dataString: string, fileName: string, mimeType = "text/plain") {
        const blob = new Blob([dataString], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = fileName;
        link.click();
        URL.revokeObjectURL(url);
    }

    // ======== 导出 glb / gltf ========
    async function exportGLTF(format: "glb" | "gltf") {
        if (!threeSceneRef.current?.groupRef.current) {
            console.warn("场景还没准备好，无法导出。");
            return;
        }

        const exporter = new GLTFExporter();
        const group = threeSceneRef.current.groupRef.current;

        try {
            if (format === "glb") {
                // 二进制 .glb
                const glbBuffer = await exporter.parseAsync(group, {
                    binary: true,
                    embedImages: true,
                });
                // 转 Blob 二进制并下载
                if (glbBuffer instanceof ArrayBuffer) {
                    const blob = new Blob([glbBuffer], { type: "application/octet-stream" });
                    const url = URL.createObjectURL(blob);

                    const link = document.createElement("a");
                    link.href = url;
                    link.download = "scene.glb";
                    link.click();
                    URL.revokeObjectURL(url);
                } else {
                    console.error("导出的 glbBuffer 不是 ArrayBuffer 类型");
                }
            } else {
                // 文本 .gltf
                const gltfJson = await exporter.parseAsync(group, {
                    binary: false,
                    embedImages: true,
                });
                // gltfJson 是一个 JSON 对象，转字符串
                const dataStr = JSON.stringify(gltfJson, null, 2);
                downloadTextData(dataStr, "scene.gltf", "application/json");
            }
        } catch (err) {
            console.error(`导出 ${format} 失败:`, err);
            messageApi?.error("导出失败，请检查控制台信息。");
        }
    }

    // ======== 导出 .obj ========
    function exportOBJ() {
        if (!threeSceneRef.current?.groupRef.current) {
            console.warn("场景还没准备好，无法导出。");
            return;
        }

        const exporter = new OBJExporter();
        const group = threeSceneRef.current.groupRef.current;
        try {
            // 注意：OBJExporter.parse 返回的是字符串
            const objString = exporter.parse(group);
            downloadTextData(objString, "scene.obj", "text/plain");
        } catch (err) {
            console.error("导出 OBJ 失败:", err);
            messageApi?.error("导出 OBJ 失败，请检查控制台信息。");
        }
    }

    // ======== 导出 .stl ========
    function exportSTL() {
        if (!threeSceneRef.current?.groupRef.current) {
            console.warn("场景还没准备好，无法导出。");
            return;
        }

        const exporter = new STLExporter();
        const group = threeSceneRef.current.groupRef.current;
        try {
            /**
             * STLExporter.parse 支持两种：
             *   1) parse(scene, { binary: false }) => 返回 ASCII STL 字符串
             *   2) parse(scene, { binary: true }) => 返回 ArrayBuffer (二进制)
             * 这里示例用 ASCII 文本 STL
             */
            const stlString = exporter.parse(group, { binary: false });
            downloadTextData(stlString, "scene.stl", "model/stl");
        } catch (err) {
            console.error("导出 STL 失败:", err);
            messageApi?.error("导出 STL 失败，请检查控制台信息。");
        }
    }

    // 内部组件：提供给 ref 的方法
    const CanvasToolsImpl: React.FC<ScreenshotProps> = ({ orbitRef }) => {
        const { gl, scene, camera } = useThree();

        useImperativeHandle(ref, () => ({
            takeScreenshot: () => {
                gl.render(scene, camera);
                const bounding = computeScreenBoundingBox(scene, camera, gl);
                if (!bounding) {
                    messageApi?.warning("场景为空或对象在屏幕之外，无法截图。");
                    return;
                }

                let { minX, minY, width, height } = bounding;
                const dpr = gl.getPixelRatio();
                minX = Math.floor(minX * dpr);
                minY = Math.floor(minY * dpr);
                width = Math.floor(width * dpr);
                height = Math.floor(height * dpr);

                // 全画面
                const fullDataURL = gl.domElement.toDataURL("image/png");
                const croppedCanvas = document.createElement("canvas");
                croppedCanvas.width = width;
                croppedCanvas.height = height;
                const ctx = croppedCanvas.getContext("2d")!;

                const img = new Image();
                img.onload = () => {
                    ctx.drawImage(img, minX, minY, width, height, 0, 0, width, height);
                    const croppedDataURL = croppedCanvas.toDataURL("image/png");
                    const link = document.createElement("a");
                    link.href = croppedDataURL;
                    link.download = "screenshot.png";
                    link.click();
                };
                img.src = fullDataURL;
            },

            resetCamera: () => {
                orbitRef.current?.reset();
                camera.position.set(0, -20, 50);
                camera.lookAt(0, 0, 0);
                camera.updateProjectionMatrix();
            },

            // ======== 多格式导出入口 ========
            exportScene: (format) => {
                if (!scene) {
                    messageApi?.warning("场景为空，无法导出");
                    return;
                }
                // 先渲染一次，确保最新
                gl.render(scene, camera);

                switch (format) {
                    case "glb":
                        exportGLTF("glb");
                        break;
                    case "gltf":
                        exportGLTF("gltf");
                        break;
                    case "obj":
                        exportOBJ();
                        break;
                    case "stl":
                        exportSTL();
                        break;
                    default:
                        console.warn(`不支持的导出格式: ${format}`);
                }
            },
        }));

        return null;
    };

    return (
        <Canvas
            // 如果要保证截图含透明背景 + 保留像素，通常要加 preserveDrawingBuffer: true
            camera={{ position: [0, -20, 50], fov: cameraOptions.fov }}
            gl={{
                alpha: true,             // 允许透明背景
                preserveDrawingBuffer: true, // 截图后可读取
                toneMapping: THREE.NoToneMapping,
                toneMappingExposure: 1,
            }}
            style={{ background: "transparent" }}
        >
            <CanvasToolsImpl orbitRef={orbitRef} />
            <CameraController fov={cameraOptions.fov} />
            <ThreeScene
                ref={threeSceneRef}
                texts={texts}
                fontUrl={fontUrl}
                globalTextureYOffset={globalTextureYOffset}
            />
            <OrbitControls ref={orbitRef} enableDamping={false} dampingFactor={0} />
        </Canvas>
    );
});

export default ThreeCanvas;