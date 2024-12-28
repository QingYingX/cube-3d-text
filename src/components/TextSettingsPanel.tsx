// src/components/TextSettingsPanel.tsx
import React, { useState } from "react";
import { Form, Input, Slider, Segmented, Flex, InputNumber } from "antd";
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
            <Form.Item label={`${gLang('upDownPosition')}`}>
                <Flex gap={'small'}>
                    <Slider
                        style={{ flex: 1 }}
                        min={-20}
                        max={20}
                        step={0.1}
                        value={textOptions.y}
                        onChange={(val) => onTextOptionsChange({ ...textOptions, y: val })}
                    />
                    <InputNumber
                        style={{ width: 64 }}
                        variant="filled"
                        min={-20}
                        max={20}
                        step={0.1}
                        value={textOptions.y}
                        onChange={(val) => onTextOptionsChange({ ...textOptions, y: val ?? 0 })}
                    />
                </Flex>
            </Form.Item>
            <Form.Item label={gLang('frontBackPosition')}>
                <Flex gap={'small'}>
                    <Slider
                        style={{ flex: 1 }}
                        min={-20}
                        max={20}
                        step={0.1}
                        value={textOptions.z}
                        onChange={(val) => onTextOptionsChange({ ...textOptions, z: val })}
                    />
                    <InputNumber
                        style={{ width: 64 }}
                        variant="filled"
                        min={-20}
                        max={20}
                        step={0.1}
                        value={textOptions.z}
                        onChange={(val) => onTextOptionsChange({ ...textOptions, z: val ?? 0 })}
                    />
                </Flex>
            </Form.Item>
            <Form.Item label={gLang('upDownRotate')}>
                <Flex gap={'small'}>
                    <Slider
                        style={{ flex: 1 }}
                        min={-90}
                        max={90}
                        step={1}
                        value={textOptions.rotY}
                        onChange={(val) => onTextOptionsChange({ ...textOptions, rotY: val })}
                    />
                    <InputNumber
                        style={{ width: 64 }}
                        variant="filled"
                        min={-90}
                        max={90}
                        step={1}
                        value={textOptions.rotY}
                        onChange={(val) => onTextOptionsChange({ ...textOptions, rotY: val ?? 0 })}
                    />
                </Flex>
            </Form.Item>
            <Form.Item label={gLang('fontSize')}>
                <Flex gap={'small'}>
                    <Slider
                        style={{ flex: 1 }}
                        min={1}
                        max={20}
                        step={0.1}
                        value={textOptions.size}
                        onChange={(val) => onTextOptionsChange({ ...textOptions, size: val })}
                    />
                    <InputNumber
                        style={{ width: 64 }}
                        variant="filled"
                        min={1}
                        max={20}
                        step={0.1}
                        value={textOptions.size}
                        onChange={(val) => onTextOptionsChange({ ...textOptions, size: val ?? 1 })}
                    />
                </Flex>
            </Form.Item>
            <Form.Item label={gLang('spacing')}>
                <Flex gap={'small'}>
                    <Slider
                        style={{ flex: 1 }}
                        min={0}
                        max={5}
                        step={0.1}
                        value={textOptions.letterSpacing}
                        onChange={(val) => onTextOptionsChange({ ...textOptions, letterSpacing: val })}
                    />
                    <InputNumber
                        style={{ width: 64 }}
                        variant="filled"
                        min={0}
                        max={5}
                        step={0.1}
                        value={textOptions.letterSpacing}
                        onChange={(val) => onTextOptionsChange({ ...textOptions, letterSpacing: val ?? 0 })}
                    />
                </Flex>
            </Form.Item>
            <Form.Item label={gLang('spacingWidth')}>
                <Flex gap={'small'}>
                    <Slider
                        style={{ flex: 1 }}
                        min={-0.2}
                        max={1}
                        step={0.05}
                        value={textOptions.spacingWidth}
                        onChange={(val) => onTextOptionsChange({ ...textOptions, spacingWidth: val })}
                    />
                    <InputNumber
                        style={{ width: 64 }}
                        variant="filled"
                        min={-0.2}
                        max={1}
                        step={0.05}
                        value={textOptions.spacingWidth}
                        onChange={(val) => onTextOptionsChange({ ...textOptions, spacingWidth: val ?? 0 })}
                    />
                </Flex>
            </Form.Item>
            <Form.Item label={gLang('thickness')}>
                <Flex gap={'small'}>
                    <Slider
                        style={{ flex: 1 }}
                        min={1}
                        max={10}
                        step={1}
                        value={textOptions.depth}
                        onChange={(val) => onTextOptionsChange({ ...textOptions, depth: val })}
                    />
                    <InputNumber
                        style={{ width: 64 }}
                        variant="filled"
                        min={1}
                        max={10}
                        step={1}
                        value={textOptions.depth}
                        onChange={(val) => onTextOptionsChange({ ...textOptions, depth: val ?? 1 })}
                    />
                </Flex>
            </Form.Item>
            <Form.Item label={gLang('outlineSize')}>
                <Flex gap={'small'}>
                    <Slider
                        style={{ flex: 1 }}
                        min={0}
                        max={1.0}
                        step={0.05}
                        value={textOptions.outlineWidth}
                        onChange={(val) => onTextOptionsChange({ ...textOptions, outlineWidth: val })}
                    />
                    <InputNumber
                        style={{ width: 64 }}
                        variant="filled"
                        min={0}
                        max={1}
                        step={0.05}
                        value={textOptions.outlineWidth}
                        onChange={(val) => onTextOptionsChange({ ...textOptions, outlineWidth: val ?? 0 })}
                    />
                </Flex>
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