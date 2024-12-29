import { Button, Card, Flex } from "antd";
import React from "react";
import { builtinOverlayRenderers, OverlayRendererInfo } from "../utils/overlay";
import { useLanguage } from "../language";

interface TextSettingsOverlayPanelProps {
    overlay?: OverlayRendererInfo;
    setOverlay: (overlay: OverlayRendererInfo | undefined) => void;
}

const TextSettingsOverlayPanel: React.FC<TextSettingsOverlayPanelProps> = (props) => {
    const { overlay, setOverlay } = props;
    const { gLang } = useLanguage();

    return (
        <Card size={'small'}>
            <Flex gap={'small'} wrap>
                <Button
                    block
                    type={overlay === undefined ? 'primary' : undefined}
                    ghost={overlay === undefined}
                    style={{
                        height: 'auto'
                    }}
                    onClick={() => setOverlay(undefined)}
                >
                    {gLang('overlay.none')}
                </Button>
                {builtinOverlayRenderers.map((info) => (
                    <Button
                        type={overlay && overlay.name === info.name ? 'primary' : undefined}
                        ghost={overlay && overlay.name === info.name}
                        onClick={() => setOverlay(info)}
                        style={{
                            height: 'auto',
                            minWidth: '120px',
                            flex: '1 1 auto'
                        }}
                    >
                        <Flex gap={'small'} vertical>
                            <div style={{
                                marginTop: 8,
                                width: '100%',
                                height: 32,
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'center'
                            }}>
                                <img
                                    src={info.preview}
                                    alt={info.name}
                                    style={{
                                        height: '100%',
                                        width: 'auto',
                                        objectFit: 'contain'
                                    }}
                                />
                            </div>
                            <div style={{ textAlign: 'center' }}>
                                {gLang(info.name)}
                            </div>
                        </Flex>
                    </Button>
                ))}
            </Flex>
        </Card>
    );
};

export default TextSettingsOverlayPanel;