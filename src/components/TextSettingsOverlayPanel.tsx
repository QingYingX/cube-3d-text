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
            <Flex gap={'small'} vertical>
                <Button
                    block
                    type={overlay === undefined ? 'primary' : undefined}
                    ghost={overlay === undefined}
                    onClick={() => setOverlay(undefined)}
                >
                    {gLang('overlay.none')}
                </Button>
                {builtinOverlayRenderers.map((info) => (
                    <Button
                        block
                        type={overlay && overlay.name === info.name ? 'primary' : undefined}
                        ghost={overlay && overlay.name === info.name}
                        onClick={() => setOverlay(info)}
                    >
                        {gLang(info.name)}
                    </Button>
                ))}
            </Flex>
        </Card>
    );
};

export default TextSettingsOverlayPanel;