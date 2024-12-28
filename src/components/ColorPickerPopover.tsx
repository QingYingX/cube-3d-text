import React from "react";
import { ColorPicker } from "antd";

interface ColorPickerPopoverProps {
    color: string;
    onChange: (color: string) => void;
    label: string;
}

const ColorPickerPopover: React.FC<ColorPickerPopoverProps> = ({ color, onChange }) => {
    return (
        <ColorPicker
            value={color}
            onChange={newColor => {
                onChange(newColor.toCssString());
            }}
        />
    );
};

export default ColorPickerPopover;