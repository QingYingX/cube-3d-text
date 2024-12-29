import * as THREE from "three";
import { offsetShape } from "./offsetShape";

export type OverlayRenderer = (
    ctx: CanvasRenderingContext2D,
    shapes: THREE.Shape[],
    width: number,
    height: number
) => void;

export const overlayRendererTest: OverlayRenderer = (ctx, shapes) => {
    ctx.fillStyle = "#ff0000";
    shapes.forEach((shape) => {
        ctx.fill(shapeToCanvasPath(shape), 'evenodd');
    });
};

export const overlayRendererHighlightUp: OverlayRenderer = (ctx, shapes) => {
    const HIGHLIGHT_HEIGHT = 0.04;
    const HIGHLIGHT_COLOR = "rgba(255, 255, 255, 0.5)";

    const paths = shapes.map(shape => shapeToCanvasPath(shape));

    // 创建矩阵用于路径变换
    const matrix = new DOMMatrix();
    matrix.translateSelf(0, -HIGHLIGHT_HEIGHT);

    // 布尔相减，减去偏移后的路径
    paths.forEach(path => {
        ctx.save();
        const combinedPath = new Path2D();
        combinedPath.addPath(path, matrix);
        combinedPath.addPath(path);
        ctx.fillStyle = HIGHLIGHT_COLOR;
        ctx.fill(combinedPath, 'evenodd');
        ctx.restore();
    });
}

export const overlayRendererHighlightDown: OverlayRenderer = (ctx, shapes) => {
    const HIGHLIGHT_HEIGHT = 0.04;
    const HIGHLIGHT_COLOR = "rgba(255, 255, 255, 0.5)";

    const paths = shapes.map(shape => shapeToCanvasPath(shape));

    // 创建矩阵用于路径变换
    const matrix = new DOMMatrix();
    matrix.translateSelf(0, HIGHLIGHT_HEIGHT);

    // 布尔相减，减去偏移后的路径
    paths.forEach(path => {
        ctx.save();
        const combinedPath = new Path2D();
        combinedPath.addPath(path, matrix);
        combinedPath.addPath(path);
        ctx.fillStyle = HIGHLIGHT_COLOR;
        ctx.fill(combinedPath, 'evenodd');
        ctx.restore();
    });
};

export const overlayRendererHighlightUpDown: OverlayRenderer = (ctx, shapes, width, hight) => {
    overlayRendererHighlightUp(ctx, shapes, width, hight);
    overlayRendererHighlightDown(ctx, shapes, width, hight); 
} 

interface StrokeContext {
    ctx: CanvasRenderingContext2D;
    shapes: THREE.Shape[];
    strokeWidth: number;
    strokeColor: string;
}

const innerStroke = ({ ctx, shapes, strokeWidth, strokeColor }: StrokeContext): void => {
    const path = new Path2D();
    shapes.forEach((shape: THREE.Shape) => {
        shapeToCanvasPath(shape, path);
    });
    const offsetPath: Path2D = new Path2D();
    shapes.map((shape: THREE.Shape) => offsetShape(shape, -strokeWidth)).forEach((offsetShapes: THREE.Shape[]) => {
        offsetShapes.forEach((offsetShape: THREE.Shape) => {
            shapeToCanvasPath(offsetShape, offsetPath);
        });
    });

    // path - shapesOffset
    const combinedPath = new Path2D();
    combinedPath.addPath(path);
    combinedPath.addPath(offsetPath);
    ctx.fillStyle = strokeColor;
    ctx.fill(combinedPath, 'evenodd');
}

export const overlayRendererInnerStroke: OverlayRenderer = (ctx, shapes) => {
    innerStroke({ ctx, shapes, strokeWidth: 0.03, strokeColor: "rgba(255, 255, 255, 0.5)" });
};

export const overlayRendererGlass: OverlayRenderer = (ctx, shapes) => {
    innerStroke({ ctx, shapes, strokeWidth: 0.045, strokeColor: "rgba(255, 255, 255, 0.3)" });
    innerStroke({ ctx, shapes, strokeWidth: 0.02, strokeColor: "rgba(255, 255, 255, 0.4)" });
}

export const overlayRendererShine: OverlayRenderer = (ctx, _, width, height) => {
    const GRADIENT_COLOR_START = "rgba(255, 255, 255, 0.6)";
    const GRADIENT_COLOR_END = "rgba(255, 255, 255, 0.1)";

    const maskWidth = 0.35;
    const space = 0.4;

    ctx.save();

    console.log("width", width, "height", height);

    // 创建从上到下的渐变
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(1, GRADIENT_COLOR_START);
    gradient.addColorStop(0, GRADIENT_COLOR_END);

    const path = new Path2D();
    path.rect(0, 0, width, height);

    // 创建斜长方形
    for (let x = 0; x < width + space + maskWidth; x += (space + maskWidth)) {
        const shinePath = new Path2D();
        shinePath.moveTo(x, 0);
        shinePath.lineTo(x + maskWidth, 0);
        shinePath.lineTo(x + maskWidth - height, height);
        shinePath.lineTo(x - height, height);
        shinePath.closePath();

        // 应用裁剪
        path.addPath(shinePath);
    }

    ctx.fillStyle = gradient;
    ctx.fill(path, 'evenodd');
    ctx.restore();
};

export interface OverlayRendererInfo {
    name: string;
    renderer: OverlayRenderer;
    preview: string;
};

export const builtinOverlayRenderers: OverlayRendererInfo[] = [
    {
        name: "overlay.highlightTop",
        renderer: overlayRendererHighlightUp,
        preview: "/overlay-preview/highlight-top.png",
    },
    {
        name: "overlay.highlightBottom",
        renderer: overlayRendererHighlightDown,
        preview: "/overlay-preview/highlight-bottom.png",
    },
    {
        name: "overlay.highlightTopBottom",
        renderer: overlayRendererHighlightUpDown,
        preview: "/overlay-preview/highlight-top-bottom.png",
    },
    {
        name: "overlay.highlightInnerStroke",
        renderer: overlayRendererInnerStroke,
        preview: "/overlay-preview/inner-stroke.png",
    },
    {
        name: "overlay.highlightShine",
        renderer: overlayRendererShine,
        preview: "/overlay-preview/shine.png",
    },
    {
        name: "overlay.highlightGlass",
        renderer: overlayRendererGlass,
        preview: "/overlay-preview/glass.png",
    }
];

// ====== 工具 ======

export const shapeToCanvasPath = (shape: THREE.Shape, path?: Path2D): Path2D => {
    if (path === undefined) {
        path = new Path2D();
    }

    // 绘制主轮廓
    shape.curves.forEach((curve, i) => {
        const points = curve.getPoints(12);
        points.forEach((point, j) => {
            if (i === 0 && j === 0) {
                path.moveTo(point.x, point.y);
            } else {
                path.lineTo(point.x, point.y);
            }
        });
    });

    // 绘制孔洞
    if (shape.holes && shape.holes.length > 0) {
        shape.holes.forEach(hole => {
            hole.curves.forEach((curve, i) => {
                const points = curve.getPoints(12);
                points.forEach((point, j) => {
                    if (i === 0 && j === 0) {
                        path.moveTo(point.x, point.y);
                    } else {
                        path.lineTo(point.x, point.y);
                    }
                });
            });
        });
    }

    return path;
};