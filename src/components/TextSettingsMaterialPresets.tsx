// src/components/TextSettingsMaterialPanel.tsx
import React, { CSSProperties } from "react";
import { Card, Flex, Button, ConfigProvider } from "antd";
import {
    TextMaterials,
    TextMaterialGradientOption,
    TextMaterialImageOption,
    TextMaterialColorOption,
} from "../types/text";
import { CheckSquareTwoTone } from "@ant-design/icons";

interface TextSettingsMaterialPanelProps {
    presetMaterials: TextMaterials[];
    materials: TextMaterials;
    onMaterialsChange: (materials: TextMaterials) => void;
}

const TextSettingsMaterialPanel: React.FC<TextSettingsMaterialPanelProps> = ({
                                                                                 presetMaterials,
                                                                                 materials,
                                                                                 onMaterialsChange,
                                                                             }) => {

    const renderPreview = (material: TextMaterials) : CSSProperties => {
        const style: CSSProperties = {};
        switch (material.front.mode) {
            case "color": {
                style.backgroundColor = (material.front as TextMaterialColorOption).color;
                break;
            }
            case "gradient": {
                    const {colorGradualStart, colorGradualEnd} = material.front as TextMaterialGradientOption;
                    style.background = `linear-gradient(180deg, ${colorGradualStart}, ${colorGradualEnd})`;
                break;
            }
            case "image": {
                style.backgroundImage = `url(${(material.front as TextMaterialImageOption).image})`;
                style.backgroundSize = 'auto 100%';
                style.imageRendering = 'pixelated';
                break;
            }
        }
        switch (material.down.mode) {
            case "color": {
                // Inner shadow with color
                style.boxShadow = `0 -2px 0 0 ${(material.down as TextMaterialColorOption).color} inset`;
                break;
            }
            case "gradient": {
                const { colorGradualStart } = material.down as TextMaterialGradientOption;
                // Inner shadow with gradient end color
                style.boxShadow = `0 -2px 0 0 ${colorGradualStart} inset`;
                break;
            }
        }
        return style;
    };

    type TwoToneColor = string | [string, string];

    const iconColor = (materials: TextMaterials): TwoToneColor => {
        const colors: TwoToneColor = ['white', 'rgba(255, 255, 255, .1)'];
        switch (materials.down.mode) {
            case "color":
                colors[0] = (materials.down as TextMaterialColorOption).color;
                break;
            case "gradient":
                colors[0] = (materials.down as TextMaterialGradientOption).colorGradualEnd;
                break;
        }
        return colors;
    }

    return (
        <Card size={'small'}>
            <Flex gap={'small'} vertical>
                {presetMaterials.map((preset) => (
                    <ConfigProvider
                        key={presetMaterials.indexOf(preset)}
                        theme={{
                            token: {
                                colorPrimary: iconColor(preset)[0],
                            }
                        }}
                    >
                        <Button
                            block
                            type={JSON.stringify(preset) === JSON.stringify(materials) ? 'primary' : undefined}
                            ghost={JSON.stringify(preset) === JSON.stringify(materials)}
                            onClick={() => onMaterialsChange(preset)}
                            style={renderPreview(preset)}
                        >
                            {JSON.stringify(preset) === JSON.stringify(materials) && <CheckSquareTwoTone twoToneColor={iconColor(preset)}/>}
                        </Button>
                    </ConfigProvider>
                ))}
            </Flex>
        </Card>
    );
};

export default TextSettingsMaterialPanel;