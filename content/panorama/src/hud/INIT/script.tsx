import { useEffect } from 'react';
import { render, useNetTableKey } from 'react-panorama-x';
import { MainState } from '../../def/defs';

export const InitMain = () => {
    const gameState = useNetTableKey('gameloop', 'current_state');

    // useEffect(() => {
    //     gameState?.mainState;
    // }, [gameState]);

    return (
        <Panel className={`InitMain ${gameState?.mainState == MainState.INIT ? 'view' : 'close'}`}>
            <Label text={'游戏正在初始化'} className="tit" />
        </Panel>
    );
};

// render(<InitMain />, $.GetContextPanel());
