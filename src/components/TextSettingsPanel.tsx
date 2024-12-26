// src/components/TextSettingsPanel.tsx
import React, { useState } from "react";
import { Form, Input, Slider, Segmented, Flex } from "antd";
import { TextOptions } from "../types/text";
import TextSettingsMaterialPanel from "./TextSettingsMaterialPanel.tsx";
import TextSettingsMaterialPresets from "./TextSettingsMaterialPresets.tsx";
import { presetMaterials } from "../presetMaterials.ts";
import { useLanguage } from "../language.tsx";

interface TextSettingsPanelProps {
    text: string;
    textOptions: TextOptions;
    onTextChange: (text: string) => void;
    onTextOptionsChange: (options: TextOptions) => void;
}

const TextSettingsPanel: React.FC<TextSettingsPanelProps> = ({
                                                                 text,
                                                                 textOptions,
                                                                 onTextChange,
                                                                 onTextOptionsChange,
                                                             }) => {

    const { gLang } = useLanguage();
    const [materialType, setMaterialType] = useState<'预设' | '自定义'>('预设');

    return (
        <>
            <Form.Item label={gLang('content')}>
                <Input value={text} onChange={(e) => onTextChange(e.target.value)} />
            </Form.Item>
            <Form.Item label={`${gLang('upDownPosition')} (${textOptions.y.toFixed(1)})`}>
                <Slider
                    min={-20}
                    max={20}
                    step={0.1}
                    value={textOptions.y}
                    onChange={(val) => onTextOptionsChange({ ...textOptions, y: val })}
                />
            </Form.Item>
            <Form.Item label={`${gLang('frontBackPosition')} (${textOptions.z.toFixed(1)})`}>
                <Slider
                    min={-20}
                    max={20}
                    step={0.1}
                    value={textOptions.z}
                    onChange={(val) => onTextOptionsChange({ ...textOptions, z: val })}
                />
            </Form.Item>
            <Form.Item label={`${gLang('upDownRotate')} (${textOptions.rotY.toFixed(1)})`}>
                <Slider
                    min={-90}
                    max={90}
                    step={1}
                    value={textOptions.rotY}
                    onChange={(val) => onTextOptionsChange({ ...textOptions, rotY: val })}
                />
            </Form.Item>
            <Form.Item label={`${gLang('fontSize')} (${textOptions.size.toFixed(1)})`}>
                <Slider
                    min={1}
                    max={20}
                    step={0.1}
                    value={textOptions.size}
                    onChange={(val) => onTextOptionsChange({ ...textOptions, size: val })}
                />
            </Form.Item>
            <Form.Item label={`${gLang('spacing')} (${textOptions.letterSpacing.toFixed(1) ?? "1.0"})`}>
                <Slider
                    min={0}
                    max={5}
                    step={0.1}
                    value={textOptions.letterSpacing}
                    onChange={(val) => onTextOptionsChange({ ...textOptions, letterSpacing: val })}
                />
            </Form.Item>
            <Form.Item label={`${gLang('spacingWidth')} (${textOptions.spacingWidth.toFixed(1) ?? "1.0"})`}>
                <Slider
                    min={-0.2}
                    max={1}
                    step={0.05}
                    value={textOptions.spacingWidth}
                    onChange={(val) => onTextOptionsChange({ ...textOptions, spacingWidth: val })}
                />
            </Form.Item>
            <Form.Item label={`${gLang('thickness')} (${textOptions.depth.toFixed(1)})`}>
                <Slider
                    min={1}
                    max={10}
                    step={1}
                    value={textOptions.depth}
                    onChange={(val) => onTextOptionsChange({ ...textOptions, depth: val })}
                />
            </Form.Item>
            <Form.Item label={`${gLang('outlineSize')} (${textOptions.outlineWidth.toFixed(1)})`}>
                <Slider
                    min={0}
                    max={1.0}
                    step={0.05}
                    value={textOptions.outlineWidth}
                    onChange={(val) => onTextOptionsChange({ ...textOptions, outlineWidth: val })}
                />
            </Form.Item>
            <Form.Item label={gLang('texture')} layout={'vertical'}>
                <Flex gap={'small'} vertical>
                    <Segmented value={materialType} options={[{label: gLang('presuppose'), value: '预设'}, {label: gLang('customize'), value: '自定义'}]} block onChange={setMaterialType} />
                    {(materialType === '预设') ? (
                        <TextSettingsMaterialPresets
                            presetMaterials={presetMaterials}
                            materials={textOptions.materials}
                            onMaterialsChange={(materials) => onTextOptionsChange({...textOptions, materials})}
                        />
                    ) : (
                        <TextSettingsMaterialPanel
                            materials={textOptions.materials}
                            onMaterialsChange={(materials) => onTextOptionsChange({...textOptions, materials})}
                        />
                    )}
                </Flex>
            </Form.Item>
        </>
    );
};

export default TextSettingsPanel;