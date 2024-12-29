// src/utils/createSpacedTextGeometry.ts
import * as THREE from "three";
import { Font } from "three/examples/jsm/loaders/FontLoader.js";
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { TextGeometry } from "three/examples/jsm/geometries/TextGeometry.js";
import * as ClipperLib from 'clipper-lib';
import { OFFSET_SCALE, offsetShape } from "./offsetShape";

/**
 * 计算单个形状的有向面积（不包括内洞）
 * @param shape THREE.Shape 或 THREE.Path 对象
 * @param curveSegments 分段数
 * @returns 有向面积，正值表示逆时针，负值表示顺时针
 */
const computeShapeArea = (shape: THREE.Shape | THREE.Path, curveSegments: number = 12): number => {
    const points = shape.getPoints(curveSegments);
    let area = 0;
    const n = points.length;

    for (let i = 0; i < n; i++) {
        const p1 = points[i];
        const p2 = points[(i + 1) % n];
        area += (p1.x * p2.y - p2.x * p1.y);
    }

    return area / 2;
};

/**
 * 反转 THREE.Shape 或 THREE.Path 的顶点顺序
 * @param shape THREE.Shape 或 THREE.Path 对象
 * @param curveSegments 分段数
 * @returns 反转后的 THREE.Shape 或 THREE.Path 对象
 */
const reverseShape = (shape: THREE.Shape | THREE.Path, curveSegments: number = 12): THREE.Shape | THREE.Path => {
    const points = shape.getPoints(curveSegments).reverse();
    let reversedShape: THREE.Shape | THREE.Path;

    if (shape instanceof THREE.Shape) {
        reversedShape = new THREE.Shape(points);
    } else if (shape instanceof THREE.Path) {
        reversedShape = new THREE.Path(points);
    } else {
        throw new Error("Unsupported shape type");
    }

    return reversedShape;
};

/**
 * 确保形状的顶点顺序正确
 * 外轮廓为逆时针，内洞为顺时针
 * @param shape THREE.Shape 对象
 * @param curveSegments 分段数
 * @returns 调整后的 THREE.Shape 对象
 */
const ensureWindingOrder = (shape: THREE.Shape, curveSegments: number = 12): THREE.Shape => {
    // 计算主轮廓的有向面积
    const outerArea = computeShapeArea(shape, curveSegments);

    // 如果主轮廓为顺时针（负面积），则反转
    if (outerArea < 0) {
        shape = reverseShape(shape, curveSegments) as THREE.Shape;
    }

    // 确保所有内洞为顺时针（负面积）
    shape.holes.forEach((hole, index) => {
        const holeArea = computeShapeArea(hole, curveSegments);
        if (holeArea > 0) {
            // 替换原始内洞
            shape.holes[index] = reverseShape(hole, curveSegments) as THREE.Path;
        }
    });

    return shape;
};

interface CreateSpacedTextGeometryOptions {
    text: string;
    font: Font;
    spacingWidth: number;
    size: number;
    height: number;
    curveSegments: number;
    bevelEnabled: boolean;
    letterSpacing: number;
}

export const createSpacedTextGeometry = ({
                                             text,
                                             font,
                                             spacingWidth,
                                             size,
                                             height,
                                             curveSegments,
                                             bevelEnabled,
                                             letterSpacing = 0
                                         }: CreateSpacedTextGeometryOptions): THREE.BufferGeometry => {
    const geometries: THREE.BufferGeometry[] = [];
    let offsetX = 0;

    const spacing = size * 0.12;

    for (let i = 0; i < text.length; i++) {
        const char = text[i];
        if (char === " ") {
            // Handle space: set spacing based on font's space width
            // const metrics = (font.data as ExtendedFontData).metrics;
            const spaceWidth = size * spacingWidth;
            offsetX += spaceWidth + letterSpacing * spacing;
            continue;
        }

        const charGeometry = new TextGeometry(char, {
            font,
            size,
            depth: height,
            curveSegments,
            bevelEnabled
        });

        charGeometry.computeBoundingBox();
        const charWidth = charGeometry.boundingBox ? charGeometry.boundingBox.max.x - charGeometry.boundingBox.min.x : size;

        charGeometry.translate(offsetX, 0, 0);
        geometries.push(charGeometry);

        // Update offset for the next character
        offsetX += charWidth + letterSpacing * spacing;
    }

    // Merge all character geometries
    const mergedGeometry = mergeGeometries(geometries, false);
    mergedGeometry.center(); // Center if needed

    return mergedGeometry;
};

export function assignFrontUV(geometry: THREE.BufferGeometry) {
    // 确保 geometry 有 boundingBox
    geometry.computeBoundingBox();
    const box = geometry.boundingBox!;
    const size = new THREE.Vector3();
    box.getSize(size); // (width, height, depth)

    // 如果 geometry 没有 uv 属性，需要创建一个空的
    let uvAttr = geometry.getAttribute("uv") as THREE.BufferAttribute;
    if (!uvAttr) {
        const positionsCount = geometry.getAttribute("position").count;
        const uvArray = new Float32Array(positionsCount * 2);
        uvAttr = new THREE.BufferAttribute(uvArray, 2);
        geometry.setAttribute("uv", uvAttr);
    }

    const posAttr = geometry.getAttribute("position") as THREE.BufferAttribute;
    const normalAttr = geometry.getAttribute("normal") as THREE.BufferAttribute;

    for (let i = 0; i < posAttr.count; i++) {
        const nz = normalAttr.getZ(i);

        const x = posAttr.getX(i);
        const y = posAttr.getY(i);

        // 判断是否是“前面”
        // 这里简单用 nz>0.9 当作正面
        if (nz > 0.9) {
            // 将 (x,y) 投影到 boundingBox 的 [0,1] 区域
            const u = (x - box.min.x) / size.x;
            const v = (y - box.min.y) / size.y;
            uvAttr.setXY(i, u, v);
        } else {
            // 如果不是正面，可以随便设置，比如 0,0
            uvAttr.setXY(i, 0, 0);
        }
    }

    uvAttr.needsUpdate = true;
}

interface CreateSpacedTextOutlineGeometryOptions {
    text: string;
    font: Font;
    spacingWidth: number;
    size: number;
    height: number;
    outlineWidth: number;
    curveSegments: number;
    bevelEnabled: boolean;
    letterSpacing: number;
}

export const createSpacedTextGeometryOutline = ({
                                                    text,
                                                    font,
                                                    spacingWidth,
                                                    size,
                                                    height,
                                                    outlineWidth,
                                                    curveSegments,
                                                    bevelEnabled,
                                                    letterSpacing = 0,
                                                }: CreateSpacedTextOutlineGeometryOptions): THREE.BufferGeometry => {
    const allShapes: THREE.Shape[] = [];
    let offsetX = 0;

    const spacing = size * 0.12;

    for (let i = 0; i < text.length; i++) {
        const char = text[i];
        if (char === " ") {
            // 处理空格：根据字体的空格宽度设置间距
            //const metrics = (font.data as ExtendedFontData).metrics;
            //const spaceWidth = metrics && metrics.advanceWidth ? (metrics.advanceWidth * size / 1000) : (size * 0.2);
            const spaceWidth = size * spacingWidth;
            offsetX += spaceWidth + letterSpacing * spacing;
            continue;
        }

        const charShapes = font.generateShapes(char, size);

        // 确保顶点顺序正确
        const adjustedShapes: THREE.Shape[] = charShapes.map(shape => ensureWindingOrder(shape, curveSegments));

        // 对每个形状进行膨胀
        const expandedShapes: THREE.Shape[] = [];
        adjustedShapes.forEach(shape => {
            const offsetted = offsetShape(shape, outlineWidth);
            expandedShapes.push(...offsetted);
        });

        // 仅保留外轮廓（有向面积为正的形状）
        const outerShapes = expandedShapes.filter(shape => computeShapeArea(shape, curveSegments) > 0);

        if (outerShapes.length === 0) {
            console.log('No outer shapes for char:', char);
            // 如果没有外轮廓，则直接插入所有形状
            outerShapes.push(...expandedShapes);
        }

        // 将膨胀后的形状转换为 ClipperLib.Path
        const clipperPaths: ClipperLib.Path[] = outerShapes.map(shape =>
            shape.getPoints().map(p => ({ X: Math.round(p.x * OFFSET_SCALE) + Math.round(offsetX * OFFSET_SCALE), Y: Math.round(p.y * OFFSET_SCALE) }))
        );

        // 使用 Clipper.js 进行联合操作，合并重叠部分
        const clipper = new ClipperLib.Clipper();
        clipper.AddPaths(clipperPaths, ClipperLib.PolyType.ptSubject, true);

        const unionSolution: ClipperLib.Paths = [];
        clipper.Execute(ClipperLib.ClipType.ctUnion, unionSolution, ClipperLib.PolyFillType.pftNonZero, ClipperLib.PolyFillType.pftNonZero);

        // 将联合后的路径转换回 THREE.Shape 并添加到 allShapes
        unionSolution.forEach(path => {
            const points = path.map(p => new THREE.Vector2(p.X / OFFSET_SCALE, p.Y / OFFSET_SCALE));
            const mergedShape = new THREE.Shape(points);
            allShapes.push(mergedShape);
        });

        // 计算字符宽度以更新 offsetX
        const charGeometry = new THREE.ShapeGeometry(adjustedShapes);
        charGeometry.computeBoundingBox();
        const charWidth = charGeometry.boundingBox ? charGeometry.boundingBox.max.x - charGeometry.boundingBox.min.x : size;

        // 更新下一个字符的偏移量
        offsetX += charWidth + letterSpacing * spacing;
    }

    // 再次修复在面内部的孔，从而避免无效的描边
    const fixedAllShapes = allShapes.filter(shape => computeShapeArea(shape, curveSegments) > 0);

    // 使用合并后的所有形状创建几何体
    const extrudeSettings: THREE.ExtrudeGeometryOptions = {
        depth: height + outlineWidth * 2,
        bevelEnabled,
        bevelThickness: size * 0.02,
        bevelSize: size * 0.02,
        bevelSegments: curveSegments
    };

    const extrudedGeometry = new THREE.ExtrudeGeometry(fixedAllShapes, extrudeSettings);
    extrudedGeometry.center(); // 根据需要进行居中

    return extrudedGeometry;
};

export function createTextShapes2D(params: {
    text: string;
    font: Font;
    letterSpacing?: number;
    spacingWidth?: number;
}): {
    totalWidth: number;
    totalHeight: number;
    shapes: THREE.Shape[]
} {
    const {
        text,
        font,
        letterSpacing = 0,
        spacingWidth = 0.2,
    } = params;

    const size = 1;

    const shapes: THREE.Shape[] = [];
    let offsetX = 0;
    const spacing = size * 0.12;

    // 1. 生成所有字符形状
    for (let i = 0; i < text.length; i++) {
        const char = text[i];
        if (char === " ") {
            offsetX += size * spacingWidth + letterSpacing * spacing;
            continue;
        }

        const charShapes = font.generateShapes(char, size);
        charShapes.forEach((shape) => {
            const translatedPoints = shape.getPoints().map(p =>
                new THREE.Vector2(p.x + offsetX, p.y)
            );
            const translatedShape = new THREE.Shape(translatedPoints);

            if (shape.holes?.length > 0) {
                translatedShape.holes = shape.holes.map(hole => {
                    const translatedHolePoints = hole.getPoints().map(p =>
                        new THREE.Vector2(p.x + offsetX, p.y)
                    );
                    return new THREE.Path(translatedHolePoints);
                });
            }
            shapes.push(translatedShape);
        });

        const charGeometry = new THREE.ShapeGeometry(charShapes);
        charGeometry.computeBoundingBox();
        const charWidth = charGeometry.boundingBox
            ? charGeometry.boundingBox.max.x - charGeometry.boundingBox.min.x
            : size;
        offsetX += charWidth + letterSpacing * spacing;
    }

    // 2. 创建完整几何体计算精确尺寸
    const completeGeometry = new THREE.ShapeGeometry(shapes);
    completeGeometry.computeBoundingBox();
    
    const totalWidth = completeGeometry.boundingBox 
        ? completeGeometry.boundingBox.max.x - completeGeometry.boundingBox.min.x 
        : 0;
    const totalHeight = completeGeometry.boundingBox 
        ? completeGeometry.boundingBox.max.y - completeGeometry.boundingBox.min.y 
        : size;

    // 得到最左上角的点，然后将其他所有点都偏移
    const leftTop = completeGeometry.boundingBox ? completeGeometry.boundingBox.min : new THREE.Vector3();
    shapes.forEach(shape => {
        const translatedPoints = shape.getPoints().map(p => 
            new THREE.Vector2(p.x - leftTop.x, p.y - leftTop.y)
        );
        shape.curves = [];
        shape.moveTo(translatedPoints[0].x, translatedPoints[0].y);
        for (let i = 1; i < translatedPoints.length; i++) {
            shape.lineTo(translatedPoints[i].x, translatedPoints[i].y);
        }
        // 孔洞
        if (shape.holes && shape.holes.length > 0) {
            shape.holes.forEach(hole => {
                const translatedHolePoints = hole.getPoints().map(p => 
                    new THREE.Vector2(p.x - leftTop.x, p.y - leftTop.y)
                );
                hole.curves = [];
                hole.moveTo(translatedHolePoints[0].x, translatedHolePoints[0].y);
                for (let i = 1; i < translatedHolePoints.length; i++) {
                    hole.lineTo(translatedHolePoints[i].x, translatedHolePoints[i].y);
                }
            });
        }
    });

    return { shapes, totalWidth, totalHeight };
}
