import { OverlayRendererInfo } from "../utils/overlay";

export interface Text3DData {
    content: string;
    opts: TextOptions;
    position: [number, number, number];
    rotation: [number, number, number];
    fontId?: string; // 新增字段：每行文字的字体ID，未设置时使用全局字体
}

export interface WorkspaceData {
    fontId: string;
    texts: Text3DData[];
}

export interface TextOptions {
    size: number;
    depth: number;
    y: number;
    z: number;
    rotY: number
    materials: TextMaterials;
    overlay?: OverlayRendererInfo;
    outlineWidth: number;
    letterSpacing: number;
    spacingWidth: number;
}

export interface TextMaterials {
    front: TextMaterialOption;
    back: TextMaterialOption;
    up: TextMaterialOption;
    down: TextMaterialOption;
    left: TextMaterialOption;
    right: TextMaterialOption;
    outline: TextMaterialOption;
}

export type TextMaterialOption =
    | TextMaterialGradientOption
    | TextMaterialImageOption
    | TextMaterialColorOption;

export interface TextMaterialGradientOption {
    mode: 'gradient';
    colorGradualStart: string;
    colorGradualEnd: string;
    repeat: number;
    offset: number;
}

export interface TextMaterialImageOption {
    mode: 'image';
    image: string;
    repeatX: number;
    repeatY: number;
    offsetX: number;
    offsetY: number;
}

export interface TextMaterialColorOption {
    mode: 'color';
    color: string;
}

export interface CameraOptions {
    fov: number;
}