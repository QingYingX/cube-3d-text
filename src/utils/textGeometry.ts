// src/utils/createSpacedTextGeometry.ts
import * as THREE from "three";
import { Font } from "three/examples/jsm/loaders/FontLoader.js";
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { TextGeometry } from "three/examples/jsm/geometries/TextGeometry.js";
import * as ClipperLib from 'clipper-lib';

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

const OFFSET_SCALE = 1000; // 为了提高精度，进行坐标缩放

/**
 * 对 THREE.Shape 进行膨胀操作
 * @param shape THREE.Shape 对象
 * @param offset 膨胀量，正值向外膨胀，负值向内收缩
 * @returns 膨胀后的 THREE.Shape 数组
 */
const offsetShape = (shape: THREE.Shape, offset: number): THREE.Shape[] => {
    // 将 THREE.Shape 转换为 ClipperLib.Path
    const clipperPath: ClipperLib.Path = shape.getPoints().map(p => ({
        X: Math.round(p.x * OFFSET_SCALE),
        Y: Math.round(p.y * OFFSET_SCALE)
    }));

    const co = new ClipperLib.ClipperOffset();
    co.AddPath(clipperPath, ClipperLib.JoinType.jtMiter, ClipperLib.EndType.etClosedPolygon);

    const solution: ClipperLib.Paths = [];
    co.Execute(solution, offset * OFFSET_SCALE);

    // 将膨胀后的路径转换回 THREE.Shape
    const expandedShapes: THREE.Shape[] = solution.map(path => {
        const points = path.map(p => new THREE.Vector2(p.X / OFFSET_SCALE, p.Y / OFFSET_SCALE));
        return new THREE.Shape(points);
    });

    return expandedShapes;
};

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