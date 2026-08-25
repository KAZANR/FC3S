import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useStore } from '../components/StoreProvider';
import { showSuccess, showError } from '../utils/toast';
import { Spinner } from '../icons';

const isMac = () => navigator.userAgent.toLowerCase().includes('mac');

const formatModifier = (key) => {
    const map = {
        'Control': isMac() ? '⌃' : 'Ctrl',
        'Alt': isMac() ? '⌥' : 'Alt',
        'Shift': '⇧',
        'Meta': isMac() ? '⌘' : 'Win',
    };
    return map[key] || key;
};

const formatKeyDisplay = (code) => {
    if (code.startsWith('Key')) return code.slice(3);
    if (code.startsWith('Digit')) return code.slice(5);
    return code;
};

const isModifier = (code) =>
    code.includes('Control') || code.includes('Alt') || code.includes('Shift') || code.includes('Meta');

export default function Phrases() {
    const { settings, updateSettings } = useStore();
    const phrases = settings?.phrases || [];
    const [editingId, setEditingId] = useState(null);
    const [editText, setEditText] = useState('');
    const [recordingHotkeyId, setRecordingHotkeyId] = useState(null);
    const [pressedKeys, setPressedKeys] = useState([]);
    const [showAddForm, setShowAddForm] = useState(false);
    const [newText, setNewText] = useState('');

    const saveText = async (id) => {
        if (!editText.trim()) {
            showError('常用语内容不能为空');
            return;
        }
        const updated = phrases.map(p =>
            p.id === id ? { ...p, phrase: editText.trim() } : p
        );
        await updateSettings({ phrases: updated });
        setEditingId(null);
        showSuccess('常用语已更新');
    };

    useEffect(() => {
        if (recordingHotkeyId === null) return;
        const handleKeyDown = (e) => {
            e.preventDefault();
            e.stopPropagation();
            const code = e.code;
            setPressedKeys(prev => prev.includes(code) ? prev : [...prev, code]);
        };
        const handleKeyUp = async (e) => {
            e.preventDefault();
            e.stopPropagation();
            setPressedKeys(prev => {
                const remaining = prev.filter(k => k !== e.code);
                if (remaining.length > 0) return remaining;
                const allKeys = prev;
                const mods = allKeys.filter(isModifier).map(k => k.replace('Left', '').replace('Right', ''));
                const mainKeys = allKeys.filter(k => !isModifier(k));
                if (mods.length === 0 || mainKeys.length === 0) {
                    showError('快捷键需要至少一个修饰键和一个普通键');
                    setRecordingHotkeyId(null);
                    return [];
                }
                const mainKey = mainKeys[mainKeys.length - 1];
                const shortcutText = [...mods.map(formatModifier), formatKeyDisplay(mainKey)].join('+');
                const newHotkey = {
                    modifiers: mods,
                    key: mainKey,
                    shortcut: shortcutText,
                };
                const updated = phrases.map(p =>
                    p.id === recordingHotkeyId ? { ...p, hotkey: newHotkey } : p
                );
                updateSettings({ phrases: updated });
                setRecordingHotkeyId(null);
                showSuccess('快捷键已更新，重启应用后生效');
                return [];
            });
        };
        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
    }, [recordingHotkeyId, phrases]);

    const deletePhrase = async (id) => {
        const updated = phrases.filter(p => p.id !== id);
        await updateSettings({ phrases: updated });
        showSuccess('常用语已删除');
    };

    const addPhrase = async () => {
        if (!newText.trim()) {
            showError('请输入常用语内容');
            return;
        }
        const maxId = phrases.reduce((max, p) => Math.max(max, p.id), 0);
        const digitNum = Math.min(maxId + 1, 9);
        const defaultKey = `Digit${digitNum}`;
        const newPhrase = {
            id: maxId + 1,
            phrase: newText.trim(),
            hotkey: {
                modifiers: [isMac() ? 'Meta' : 'Alt'],
                key: defaultKey,
                shortcut: `${isMac() ? '⌘' : 'Alt'}+${digitNum}`,
            },
        };
        await updateSettings({ phrases: [...phrases, newPhrase] });
        setShowAddForm(false);
        setNewText('');
        showSuccess('常用语已添加，重启应用后快捷键生效');
    };

    return (
        <div className="h-full flex flex-col gap-6">
            <motion.div
                className="w-full bg-white dark:bg-zinc-900 rounded-2xl p-6 border border-zinc-200 dark:border-zinc-800 shadow-[0_8px_30px_rgb(0,0,0,0.04)]"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <div className="flex items-center justify-between mb-4">
                    <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">常用语</h1>
                    <button
                        onClick={() => { setShowAddForm(true); setNewText(''); }}
                        className="px-4 py-2 text-sm text-white bg-zinc-900 dark:bg-zinc-100 dark:text-zinc-900 rounded-lg hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors"
                    >
                        + 添加常用语
                    </button>
                </div>
                <p className="text-zinc-600 dark:text-zinc-400 text-sm">
                    按下快捷键可快速将常用语粘贴到游戏聊天框。点击文字或快捷键可编辑，修改快捷键后需重启应用生效。
                </p>
            </motion.div>

            {showAddForm && (
                <motion.div
                    className="bg-white dark:bg-zinc-900 rounded-2xl p-6 border border-zinc-200 dark:border-zinc-800 shadow-[0_8px_30px_rgb(0,0,0,0.04)]"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm text-zinc-500 mb-2">常用语内容</label>
                            <input
                                type="text"
                                value={newText}
                                onChange={(e) => setNewText(e.target.value)}
                                className="w-full px-4 py-2.5 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm text-zinc-700 dark:text-zinc-300"
                                placeholder="输入常用语内容"
                                onKeyDown={(e) => { if (e.key === 'Enter') addPhrase(); }}
                            />
                            <p className="mt-1.5 text-xs text-zinc-400">快捷键会自动分配，添加后可修改。</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={addPhrase}
                                className="px-4 py-2 text-sm text-white bg-zinc-900 dark:bg-zinc-100 dark:text-zinc-900 rounded-lg hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors"
                            >
                                确认添加
                            </button>
                            <button
                                onClick={() => { setShowAddForm(false); setNewText(''); }}
                                className="px-4 py-2 text-sm text-zinc-500 bg-zinc-100 dark:bg-zinc-800 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                            >
                                取消
                            </button>
                        </div>
                    </div>
                </motion.div>
            )}

            <div className="flex-1 overflow-auto space-y-3">
                {phrases.map((item) => {
                    const isEditingText = editingId === item.id;
                    const isRecordingKey = recordingHotkeyId === item.id;
                    return (
                        <motion.div
                            key={item.id}
                            className="bg-white dark:bg-zinc-900 rounded-2xl p-4 border border-zinc-200 dark:border-zinc-800 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:border-zinc-300 transition-all"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                        >
                            <div className="flex items-center gap-4">
                                <div className="flex-1 min-w-0">
                                    {isEditingText ? (
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="text"
                                                value={editText}
                                                onChange={(e) => setEditText(e.target.value)}
                                                className="flex-1 px-3 py-1.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm text-zinc-700 dark:text-zinc-300"
                                                autoFocus
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') saveText(item.id);
                                                    if (e.key === 'Escape') setEditingId(null);
                                                }}
                                            />
                                            <button
                                                onClick={() => saveText(item.id)}
                                                className="px-3 py-1.5 text-xs text-white bg-zinc-900 dark:bg-zinc-100 dark:text-zinc-900 rounded-lg hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors"
                                            >
                                                保存
                                            </button>
                                            <button
                                                onClick={() => setEditingId(null)}
                                                className="px-3 py-1.5 text-xs text-zinc-500 bg-zinc-100 dark:bg-zinc-800 rounded-lg hover:bg-zinc-200 transition-colors"
                                            >
                                                取消
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-2">
                                            <div className="text-sm text-zinc-900 dark:text-white truncate flex-1">
                                                {item.phrase}
                                            </div>
                                            <button
                                                onClick={() => { setEditingId(item.id); setEditText(item.phrase); }}
                                                className="shrink-0 px-2 py-1 text-xs text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                                            >
                                                编辑
                                            </button>
                                        </div>
                                    )}
                                </div>
                                <div className="shrink-0">
                                    {isRecordingKey ? (
                                        <div className="flex items-center gap-2 px-3 py-2 bg-zinc-100 dark:bg-zinc-800 rounded-lg border-2 border-zinc-900 dark:border-zinc-100">
                                            {pressedKeys.length === 0 ? (
                                                <Spinner className="w-4 h-4 text-zinc-400 animate-spin" />
                                            ) : (
                                                <span className="text-sm font-bold text-zinc-900 dark:text-white">
                                                    {pressedKeys.map(k => isModifier(k) ? formatModifier(k.replace('Left','').replace('Right','')) : formatKeyDisplay(k)).join(' + ')}
                                                </span>
                                            )}
                                            <span className="text-xs text-zinc-400">松开确认</span>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-1.5">
                                            <button
                                                onClick={() => { setRecordingHotkeyId(item.id); setPressedKeys([]); }}
                                                className="px-3 py-2 bg-zinc-100 dark:bg-zinc-800 rounded-lg text-sm font-bold text-zinc-600 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                                            >
                                                {item.hotkey.shortcut}
                                            </button>
                                            <span className="text-xs text-zinc-300 dark:text-zinc-600">点击修改</span>
                                        </div>
                                    )}
                                </div>
                                <button
                                    onClick={() => deletePhrase(item.id)}
                                    className="shrink-0 p-1.5 text-xs text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                >
                                    删除
                                </button>
                            </div>
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
} 