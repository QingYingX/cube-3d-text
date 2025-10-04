import React, { useState, useEffect } from 'react';
import { Input, Flex, Typography } from 'antd';
import { useLanguage } from '../language';

const { Text } = Typography;

interface Position3DControlProps {
    x: number;
    y: number;
    z: number;
    onPositionChange: (position: { x: number; y: number; z: number }) => void;
    xRange?: [number, number];
    yRange?: [number, number];
    zRange?: [number, number];
    step?: number;
    disabled?: boolean;
}

// 可拖拽的数值前缀组件
const DraggablePrefix: React.FC<{
    label: string;
    color: string;
    value: number;
    range: [number, number];
    step: number;
    disabled: boolean;
    onValueChange: (value: number) => void;
}> = ({ label, color, value, range, step, disabled, onValueChange }) => {
    const { gLang } = useLanguage();
    const [isDragging, setIsDragging] = useState(false);
    const [dragStartValue, setDragStartValue] = useState(0);
    const [dragStartY, setDragStartY] = useState(0);

    const handleMouseDown = (event: React.MouseEvent) => {
        if (disabled) return;

        event.preventDefault();
        setIsDragging(true);
        setDragStartValue(value);
        setDragStartY(event.clientY);
        document.body.style.cursor = 'ns-resize';
        document.body.style.userSelect = 'none';
    };

    const handleTouchStart = (event: React.TouchEvent) => {
        if (disabled) return;

        event.preventDefault();
        event.stopPropagation(); // 防止触发页面滚动
        setIsDragging(true);
        setDragStartValue(value);
        setDragStartY(event.touches[0].clientY);
        document.body.style.userSelect = 'none';

        // 防止页面滚动
        document.body.style.overflow = 'hidden';
        document.body.style.position = 'fixed';
        document.body.style.width = '100%';

        // 添加触觉反馈（如果支持）
        if ('vibrate' in navigator) {
            navigator.vibrate(10);
        }
    };

    useEffect(() => {
        const handleMouseMove = (event: MouseEvent) => {
            if (!isDragging) return;

            const deltaY = dragStartY - event.clientY;
            const sensitivity = 0.1;
            const deltaValue = deltaY * sensitivity;
            const newValue = dragStartValue + deltaValue;

            const clampedValue = Math.max(range[0], Math.min(range[1], newValue));
            const roundedValue = Math.round(clampedValue / step) * step;

            onValueChange(roundedValue);
        };

        const handleTouchMove = (event: TouchEvent) => {
            if (!isDragging) return;

            event.preventDefault(); // 防止页面滚动
            const deltaY = dragStartY - event.touches[0].clientY;
            const sensitivity = 0.1;
            const deltaValue = deltaY * sensitivity;
            const newValue = dragStartValue + deltaValue;

            const clampedValue = Math.max(range[0], Math.min(range[1], newValue));
            const roundedValue = Math.round(clampedValue / step) * step;

            onValueChange(roundedValue);
        };

        const handleEnd = () => {
            setIsDragging(false);
            document.body.style.cursor = 'auto';
            document.body.style.userSelect = 'auto';

            // 恢复页面滚动
            document.body.style.overflow = '';
            document.body.style.position = '';
            document.body.style.width = '';
        };

        if (isDragging) {
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleEnd);
            document.addEventListener('touchmove', handleTouchMove, { passive: false });
            document.addEventListener('touchend', handleEnd);
        }

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleEnd);
            document.removeEventListener('touchmove', handleTouchMove);
            document.removeEventListener('touchend', handleEnd);
        };
    }, [isDragging, dragStartValue, dragStartY, value, range, step, onValueChange]);

    return (
        <div
            style={{
                display: 'flex',
                alignItems: 'center',
                cursor: disabled ? 'default' : 'ns-resize',
                padding: '6px 4px',
                marginLeft: '-4px',
                minWidth: '20px',
                justifyContent: 'center',
                borderRadius: '2px',
                backgroundColor: isDragging ? '#f0f0f0' : 'transparent',
                userSelect: 'none'
            }}
            onMouseDown={handleMouseDown}
            onTouchStart={handleTouchStart}
            title={gLang('dragToAdjust', { label })}
        >
            <Text
                style={{
                    fontSize: '12px',
                    fontWeight: 600,
                    color: disabled ? '#d9d9d9' : color,
                    lineHeight: 1
                }}
            >
                {label}
            </Text>
        </div>
    );
};

const Position3DControl: React.FC<Position3DControlProps> = ({
    x,
    y,
    z,
    onPositionChange,
    xRange = [-50, 50],
    yRange = [-20, 20],
    zRange = [-20, 20],
    step = 0.1,
    disabled = false,
}) => {
    // 本地输入字符串状态，允许临时不可解析的值（如 "-", "1.", ""）
    const [inputX, setInputX] = useState<string>(x.toFixed(1));
    const [inputY, setInputY] = useState<string>(y.toFixed(1));
    const [inputZ, setInputZ] = useState<string>(z.toFixed(1));

    // 聚焦状态，避免在编辑时被外部值覆盖
    const [editingX, setEditingX] = useState(false);
    const [editingY, setEditingY] = useState(false);
    const [editingZ, setEditingZ] = useState(false);

    const formatNum = (n: number) => n.toFixed(1);

    // 当外部值变化时，同步到本地显示（非编辑中）
    useEffect(() => {
        if (!editingX) setInputX(formatNum(x));
    }, [x, editingX]);
    useEffect(() => {
        if (!editingY) setInputY(formatNum(y));
    }, [y, editingY]);
    useEffect(() => {
        if (!editingZ) setInputZ(formatNum(z));
    }, [z, editingZ]);

    // 仅允许 数字/负号/点，负号只能在开头，点只能出现一次（但允许结尾处点作为临时态）
    const allowedPartial = /^-?\d*(\.\d*)?$/;
    // 完整数字，用于提交（不以点结尾，不是空或仅负号）
    const completeNumber = /^-?\d+(?:\.\d+)?$/;

    const handleInputChange = (axis: 'x' | 'y' | 'z', raw: string) => {
        if (disabled) return;
        if (!allowedPartial.test(raw)) {
            // 拒绝包含非法字符的输入
            return;
        }

        // 更新本地字符串
        if (axis === 'x') setInputX(raw);
        if (axis === 'y') setInputY(raw);
        if (axis === 'z') setInputZ(raw);

        // 若是完整数字，立刻提交变化
        if (completeNumber.test(raw)) {
            const numValue = parseFloat(raw);
            const next = { x, y, z } as { x: number; y: number; z: number };
            next[axis] = numValue;
            onPositionChange(next);
        }
    };

    const handleBlur = (axis: 'x' | 'y' | 'z') => {
        const raw = axis === 'x' ? inputX : axis === 'y' ? inputY : inputZ;
        let nextValue = axis === 'x' ? x : axis === 'y' ? y : z;

        if (completeNumber.test(raw)) {
            nextValue = parseFloat(raw);
            const next = { x, y, z } as { x: number; y: number; z: number };
            next[axis] = nextValue;
            onPositionChange(next);
        }

        // 失焦后规范化显示为固定小数位
        const formatted = formatNum(nextValue);
        if (axis === 'x') {
            setInputX(formatted);
            setEditingX(false);
        } else if (axis === 'y') {
            setInputY(formatted);
            setEditingY(false);
        } else {
            setInputZ(formatted);
            setEditingZ(false);
        }
    };

    return (
        <Flex gap="small" align="center">
            {/* X 轴控制 */}
            <Input
                value={inputX}
                disabled={disabled}
                onChange={(e) => handleInputChange('x', e.target.value)}
                onFocus={() => setEditingX(true)}
                onBlur={() => handleBlur('x')}
                style={{ flex: 1 }}
                prefix={
                    <DraggablePrefix
                        label="X"
                        color="#ff4d4f"
                        value={x}
                        range={xRange}
                        step={step}
                        disabled={disabled}
                        onValueChange={(value) => {
                            setInputX(formatNum(value));
                            onPositionChange({ x: value, y, z });
                        }}
                    />
                }
            />

            {/* Y 轴控制 */}
            <Input
                value={inputY}
                disabled={disabled}
                onChange={(e) => handleInputChange('y', e.target.value)}
                onFocus={() => setEditingY(true)}
                onBlur={() => handleBlur('y')}
                style={{ flex: 1 }}
                prefix={
                    <DraggablePrefix
                        label="Y"
                        color="#52c41a"
                        value={y}
                        range={yRange}
                        step={step}
                        disabled={disabled}
                        onValueChange={(value) => {
                            setInputY(formatNum(value));
                            onPositionChange({ x, y: value, z });
                        }}
                    />
                }
            />

            {/* Z 轴控制 */}
            <Input
                value={inputZ}
                disabled={disabled}
                onChange={(e) => handleInputChange('z', e.target.value)}
                onFocus={() => setEditingZ(true)}
                onBlur={() => handleBlur('z')}
                style={{ flex: 1 }}
                prefix={
                    <DraggablePrefix
                        label="Z"
                        color="#1890ff"
                        value={z}
                        range={zRange}
                        step={step}
                        disabled={disabled}
                        onValueChange={(value) => {
                            setInputZ(formatNum(value));
                            onPositionChange({ x, y, z: value });
                        }}
                    />
                }
            />
        </Flex>
    );
};

export default Position3DControl;
