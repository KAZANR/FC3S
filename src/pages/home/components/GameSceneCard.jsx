import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { GamingPad, Repeat01, SwitchArrowHorizontal, IMac, Plus, Trash, Edit, Save, Cancel } from '../../../icons';
import { useStore } from '../../../components/StoreProvider';
import DropdownMenu from '../../../components/DropdownMenu';

const DEFAULT_GAMES = {
    lol: '英雄联盟',
    dota2: 'Dota 2',
    csgo: 'CS:GO',
    pubg: 'PUBG',
    apex: 'Apex Legends',
    overwatch: '守望先锋',
    valorant: 'Valorant',
    fortnite: 'Fortnite',
    minecraft: 'Minecraft',
    warzone: 'Warzone',
    wow: '魔兽世界'
};

export default function GameSceneCard() {
    const [showMenu, setShowMenu] = useState(false);
    const [gameName, setGameName] = useState('');
    const [showCustomScenes, setShowCustomScenes] = useState(false);
    const [editingSceneId, setEditingSceneId] = useState(null);
    const [editSceneName, setEditSceneName] = useState('');
    const [newSceneName, setNewSceneName] = useState('');
    const { settings, updateSettings, getCustomScenes, updateCustomScenes } = useStore();

    const gameId = settings?.game_scene || 'lol';
    const isDaily = settings?.daily_mode || false;

    useEffect(() => {
        const allGames = { ...DEFAULT_GAMES, ...Object.fromEntries(settings?.custom_scenes || []) };
        setGameName(allGames[gameId] || '未知游戏');
    }, [gameId, settings?.custom_scenes]);

    const handleGameSelect = async (gameId) => {
        setShowMenu(false);
        await updateSettings({ game_scene: gameId });
    };

    const toggleDailyMode = async () => {
        await updateSettings({ daily_mode: !isDaily });
    };

    const loadCustomScenes = async () => {
        const scenes = await getCustomScenes();
        return scenes;
    };

    const handleAddCustomScene = async () => {
        if (!newSceneName.trim()) return;
        const customScenes = await loadCustomScenes();
        const newId = `custom_${Date.now()}`;
        customScenes.push([newId, newSceneName]);
        await updateCustomScenes(customScenes);
        await updateSettings({ game_scene: newId });
        setNewSceneName('');
        setShowCustomScenes(false);
    };

    const handleEditScene = async (id, name) => {
        setEditingSceneId(id);
        setEditSceneName(name);
    };

    const handleSaveScene = async (id) => {
        if (!editSceneName.trim()) return;
        const customScenes = await loadCustomScenes();
        const updated = customScenes.map(([sceneId, sceneName]) =>
            sceneId === id ? [sceneId, editSceneName] : [sceneId, sceneName]
        );
        await updateCustomScenes(updated);
        if (gameId === id) {
            await updateSettings({ game_scene: id });
        }
        setEditingSceneId(null);
        setEditSceneName('');
    };

    const handleDeleteScene = async (id) => {
        if (!window.confirm('确定删除这个自定义场景吗？')) return;
        const customScenes = await loadCustomScenes();
        const updated = customScenes.filter(([sceneId]) => sceneId !== id);
        await updateCustomScenes(updated);
        if (gameId === id) {
            await updateSettings({ game_scene: 'lol' });
        }
    };

    const renderGameOptions = () => {
        const allGames = { ...DEFAULT_GAMES };
        return Object.entries(allGames).map(([id, name]) => (
            <div
                key={id}
                onClick={() => handleGameSelect(id)}
                className={`px-4 py-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer transition-colors ${gameId === id ? 'bg-zinc-100 dark:bg-zinc-800' : ''}`}
            >
                {name}
            </div>
        ));
    };

    const renderCustomScenes = async () => {
        const customScenes = await loadCustomScenes();
        return customScenes.map(([id, name]) => (
            <div key={id} className="relative">
                {editingSceneId === id ? (
                    <div className="flex items-center gap-2 p-2">
                        <input
                            type="text"
                            value={editSceneName}
                            onChange={(e) => setEditSceneName(e.target.value)}
                            className="flex-1 px-3 py-1.5 bg-white dark:bg-zinc-900 border border-zinc-500 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-zinc-500"
                            autoFocus
                        />
                        <button
                            onClick={() => handleSaveScene(id)}
                            className="px-3 py-1.5 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-lg hover:bg-zinc-700 dark:hover:bg-zinc-200 transition-colors text-sm"
                        >
                            <Save className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => { setEditingSceneId(null); setEditSceneName(''); }}
                            className="px-3 py-1.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors text-sm"
                        >
                            <Cancel className="w-4 h-4" />
                        </button>
                    </div>
                ) : (
                    <div className="flex items-center justify-between px-4 py-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer transition-colors">
                        <span onClick={() => handleGameSelect(id)} className={gameId === id ? 'font-semibold' : ''}>
                            {name}
                        </span>
                        <div className="flex gap-1">
                            <button
                                onClick={(e) => { e.stopPropagation(); handleEditScene(id, name); }}
                                className="p-1.5 text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors"
                                title="编辑"
                            >
                                <Edit className="w-4 h-4" />
                            </button>
                            <button
                                onClick={(e) => { e.stopPropagation(); handleDeleteScene(id); }}
                                className="p-1.5 text-red-500 hover:text-red-700 transition-colors"
                                title="删除"
                            >
                                <Trash className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        ));
    };

    return (
        <motion.div
            className="relative h-full flex flex-col bg-white dark:bg-zinc-900 rounded-2xl p-6 border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all duration-200 text-left shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.1)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] dark:hover:shadow-[0_8px_30px_rgb(0,0,0,0.2)] backdrop-blur-sm"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
        >
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 text-sm text-zinc-500">
                    {isDaily ? (
                        <IMac className="w-6 h-6 stroke-zinc-500" />
                    ) : (
                        <GamingPad className="w-6 h-6 stroke-zinc-500" />
                    )}
                    {isDaily ? '日常模式' : '游戏模式'}
                </div>
                <div className="flex flex-col items-end">
                    <button
                        onClick={toggleDailyMode}
                        className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm transition-colors ${isDaily
                            ? 'bg-zinc-200 text-zinc-700 hover:bg-zinc-300'
                            : 'bg-zinc-100 text-zinc-500 hover:bg-zinc-200'
                            }`}
                    >
                        <span> {isDaily ? '游戏模式' : '日常模式'}</span>
                        <Repeat01 className="w-4 h-4 text-zinc-600 hover:text-zinc-600 transition-colors" />
                    </button>
                </div>
            </div>
            <div className="flex-1 flex flex-col justify-between mt-4">
                <div className="text-sm text-zinc-400">
                    {isDaily ? '划词翻译' : ' 合适的游戏场景选择，能保证翻译时更加符合游戏语境，如Moba类游戏中的推塔、gank，fps游戏中的rush等。'}
                </div>
                {!isDaily && (
                    <div className="relative">
                        <button
                            onClick={() => setShowMenu(true)}
                            className="px-4 py-1.5 rounded-lg bg-zinc-50 hover:bg-[#EAEAEA] transition-colors text-2xl font-semibold text-zinc-900 dark:text-white"
                        >
                            {gameName}
                        </button>
                        <DropdownMenu
                            show={showMenu}
                            onClose={() => setShowMenu(false)}
                            options={DEFAULT_GAMES}
                            currentValue={gameId}
                            onSelect={handleGameSelect}
                            customOptions={settings?.custom_scenes || []}
                            onCustomClick={() => { setShowMenu(false); setShowCustomScenes(true); }}
                        />
                    </div>
                )}
            </div>

            {!isDaily && showCustomScenes && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-6 p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-200 dark:border-zinc-700"
                >
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">自定义场景</h3>
                        <button
                            onClick={() => setShowCustomScenes(false)}
                            className="p-1 text-zinc-500 hover:text-zinc-700"
                        >
                            <XClose className="w-5 h-5" />
                        </button>
                    </div>
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">添加新场景</label>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={newSceneName}
                                onChange={(e) => setNewSceneName(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleAddCustomScene()}
                                className="flex-1 px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:border-transparent"
                                placeholder="输入场景名称..."
                            />
                            <button
                                onClick={handleAddCustomScene}
                                disabled={!newSceneName.trim()}
                                className="px-4 py-2 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-lg hover:bg-zinc-700 dark:hover:bg-zinc-200 transition-colors disabled:opacity-50"
                            >
                                <Plus className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                    <div className="max-h-60 overflow-auto">
                        {renderCustomScenes()}
                    </div>
                </motion.div>
            )}
        </motion.div>
    );
}