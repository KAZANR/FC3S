import { createContext, useContext, useState, useEffect } from 'react';
import { load } from '@tauri-apps/plugin-store';
import { invoke } from '@tauri-apps/api/core';

const StoreContext = createContext(null);

export function StoreProvider({ children }) {
    const [store, setStore] = useState(null);
    const [scenesStore, setScenesStore] = useState(null);
    const [settings, setSettings] = useState(null);
    const [scenes, setScenes] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const initStore = async () => {
            try {
                const settingsStoreInstance = await load('settings.json', {
                    autoSave: 100
                });
                const scenesStoreInstance = await load('scenes.json', {
                    autoSave: 100
                });
                setStore(settingsStoreInstance);
                setScenesStore(scenesStoreInstance);
                
                const storedSettings = await settingsStoreInstance.get('settings');
                if (storedSettings) {
                    setSettings(storedSettings);
                }
                
                const storedScenes = await scenesStoreInstance.get('scenes');
                if (storedScenes) {
                    setScenes(storedScenes);
                }
            } catch (error) {
                console.error('初始化 store 失败:', error);
            } finally {
                setLoading(false);
            }
        };
        initStore();
    }, []);

    const updateSettings = async (newSettings) => {
        if (!store) return;
        const updatedSettings = { ...settings, ...newSettings };
        try {
            await store.set('settings', updatedSettings);
            await store.save();
            const storedSettings = await store.get('settings');
            if (storedSettings) {
                setSettings(storedSettings);
            }
        } catch (error) {
            console.error('更新设置失败:', error);
        }
    };

    const updateScenes = async (newScenes) => {
        if (!scenesStore) return;
        try {
            await scenesStore.set('scenes', newScenes);
            await scenesStore.save();
            setScenes(newScenes);
        } catch (error) {
            console.error('更新场景失败:', error);
        }
    };

    return (
        <StoreContext.Provider value={{
            store,
            scenesStore,
            settings,
            scenes,
            updateSettings,
            updateScenes,
            loading
        }}>
            {children}
        </StoreContext.Provider>
    );
}

export const useStore = () => {
    const context = useContext(StoreContext);
    if (!context) {
        throw new Error('useStore 必须在 StoreProvider 内部使用');
    }
    return context;
}; 