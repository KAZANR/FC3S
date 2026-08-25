import { createContext, useContext, useState, useEffect } from 'react';
import { load } from '@tauri-apps/plugin-store';
import { invoke } from '@tauri-apps/api/core';

const StoreContext = createContext(null);

export function StoreProvider({ children }) {
    const [store, setStore] = useState(null);
    const [settings, setSettings] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const initStore = async () => {
            try {
                const storeInstance = await load('store.json', {
                    autoSave: 100
                });
                setStore(storeInstance);
                const storedSettings = await storeInstance.get('settings');
                if (storedSettings) {
                    setSettings(storedSettings);
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

    const addOrUpdatePhrase = async (phrase) => {
        await invoke('add_or_update_phrase', { phrase });
        const storedSettings = await store.get('settings');
        if (storedSettings) setSettings(storedSettings);
    };

    const deletePhrase = async (phraseId) => {
        await invoke('delete_phrase', { phrase_id: phraseId });
        const storedSettings = await store.get('settings');
        if (storedSettings) setSettings(storedSettings);
    };

    const getNextPhraseId = async () => {
        return await invoke('get_next_phrase_id');
    };

    const updatePhraseHotkey = async (phraseId, hotkey) => {
        await invoke('update_phrase_hotkey', { phrase_id: phraseId, hotkey });
        const storedSettings = await store.get('settings');
        if (storedSettings) setSettings(storedSettings);
    };

    const getCustomScenes = async () => {
        return await invoke('get_custom_scenes');
    };

    const updateCustomScenes = async (scenes) => {
        await invoke('update_custom_scenes', { scenes });
    };

    return (
        <StoreContext.Provider value={{
            store,
            settings,
            updateSettings,
            loading,
            addOrUpdatePhrase,
            deletePhrase,
            getNextPhraseId,
            updatePhraseHotkey,
            getCustomScenes,
            updateCustomScenes
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