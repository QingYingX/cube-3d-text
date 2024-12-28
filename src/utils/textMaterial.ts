import * as THREE from "three";
import { TextMaterialOption, TextMaterials } from "../types/text";

// 生成渐变纹理
const createGradientTexture = (
    colorGradualStart: string,
    colorGradualEnd: string,
    repeat: number,
    offset: number
): THREE.Texture => {
    const size = 512;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const context = canvas.getContext("2d")!;

    // 创建线性渐变，从顶部到底部
    const gradient = context.createLinearGradient(0, 0, 0, size);
    gradient.addColorStop(0, colorGradualStart);
    gradient.addColorStop(1, colorGradualEnd);

    context.fillStyle = gradient;
    context.fillRect(0, 0, size, size);

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace; // 设置编码为 sRGB
    texture.needsUpdate = true;

    // 计算文本高度
    // const textHeight = maxY - minY;

    // 计算纹理在 Y 方向上的重复次数
    // const repeatY = (textHeight / size) * 1.5;

    texture.repeat.set(1, repeat);
    texture.wrapS = THREE.ClampToEdgeWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;

    // 计算偏移量，使纹理居中
    // const offsetY = -((repeatY - 1) / 2);
    texture.offset.set(0, offset);

    return texture;
};

export const createMeshStandardMaterialFromOption = (
    option: TextMaterialOption,
    reverseGradient: boolean = false,
    extra: { [key: string]: unknown } = {}
) : THREE.MeshStandardMaterial => {
    const roughness = 1.0;  // 粗糙度
    if (option.mode == 'color') {
        return new THREE.MeshStandardMaterial({ color: option.color, roughness, ...extra });
    } else if (option.mode == 'gradient') {
        return new THREE.MeshStandardMaterial({ map: createGradientTexture(
                reverseGradient ? option.colorGradualEnd : option.colorGradualStart,
                reverseGradient ? option.colorGradualStart: option.colorGradualEnd,
                option.repeat,
                option.offset
            ), roughness, ...extra });
    } else {
        // TODO
        return new THREE.MeshStandardMaterial({ color: "#FF0000", roughness, ...extra });
    }
}

// Only for test
export function createLinePointMaterial(): THREE.MeshBasicMaterial {
    return new THREE.MeshBasicMaterial({
        color: 0xff0000,
        wireframe: true
    });
}

export const createMeshBasicMaterialFromOption = (
    option: TextMaterialOption,
    reverseGradient: boolean = false,
    repeatScale: [number, number] = [1, 1],
    offsetScale: [number, number] = [1, 1],
    extraOffset: [number, number] = [0, 0],
    extra: { [key: string]: unknown } = {}
) : THREE.MeshBasicMaterial => {
    if (option.mode == 'color') {
        return new THREE.MeshBasicMaterial({ color: option.color, ...extra });
    } else if (option.mode == 'gradient') {
        return new THREE.MeshBasicMaterial({ map: createGradientTexture(
                reverseGradient ? option.colorGradualEnd : option.colorGradualStart,
                reverseGradient ? option.colorGradualStart: option.colorGradualEnd,
                option.repeat * repeatScale[1],
                option.offset * offsetScale[1] + extraOffset[1]
            ), ...extra });
    } else if (option.mode === 'image') {
        const texture = new THREE.TextureLoader().load(option.image);
        // 根据需求设置 wrap 模式与 repeat、offset 等
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(option.repeatX * repeatScale[0], (reverseGradient ? -option.repeatY : option.repeatY) * repeatScale[1]);
        texture.offset.set(option.offsetX * offsetScale[0] + extraOffset[0], (reverseGradient ? 1 - option.offsetY : option.offsetY) * offsetScale[1] + extraOffset[1]);

        texture.minFilter = THREE.NearestFilter;
        texture.magFilter = THREE.NearestFilter;

        texture.colorSpace = THREE.SRGBColorSpace;

        return new THREE.MeshBasicMaterial({
            map: texture,
            ...extra
        });
    } else {
        // 默认材质（fallback）
        return new THREE.MeshBasicMaterial({ color: "#FF0000", ...extra });
    }
}

// 创建立方体贴图材质
export const createCubeMaterial = (
    materials: TextMaterials,
    boundingBox: THREE.Box3,
    globalTextureYOffset: number
): THREE.Material[] => {
    const repeatFront = [1 / (boundingBox.max.y - boundingBox.min.y), 1 / (boundingBox.max.y - boundingBox.min.y)] as [number, number];
    const repeatSide = [1 / (boundingBox.max.y - boundingBox.min.y), 1 / (boundingBox.max.z - boundingBox.min.z)] as [number, number];
    //const offsetSide = [(boundingBox.max.z - boundingBox.min.z) / 2, (boundingBox.max.z - boundingBox.min.z) / 2] as [number, number];
    const offsetSide = [1, 1] as [number, number];  // TODO: 修正偏移量
    const extraOffset: [number, number] = [0, globalTextureYOffset];
    return [
        createMeshBasicMaterialFromOption(materials.right, true, repeatSide, offsetSide, extraOffset), // 右面
        createMeshBasicMaterialFromOption(materials.left, true, repeatSide, offsetSide, extraOffset), // 左面
        createMeshBasicMaterialFromOption(materials.up, true, repeatSide, offsetSide), // 上面
        createMeshBasicMaterialFromOption(materials.down, true, repeatSide, offsetSide), // 下面
        createMeshBasicMaterialFromOption(materials.front, false, repeatFront, [1, 1], extraOffset), // 前面
        createMeshBasicMaterialFromOption(materials.back, false, repeatFront, [1, 1], extraOffset), // 后面
    ];
};