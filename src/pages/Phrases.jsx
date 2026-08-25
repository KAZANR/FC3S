import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useStore } from '../components/StoreProvider';
import { Plus, Trash, Edit, Save, Cancel, Keyboard } from '../icons';

export default function Phrases() {
    const { settings, addOrUpdatePhrase, deletePhrase, getNextPhraseId, updatePhraseHotkey } = useStore();
    const phrases = settings?.phrases || [];
    const [editingId, setEditingId] = useState(null);
    const [editText, setEditText] = useState('');
    const [editHotkey, setEditHotkey] = useState(null);
    const [capturingHotkey, setCapturingHotkey] = useState(false);
    const [showAdd, setShowAdd] = useState(false);
    const [newPhraseText, setNewPhraseText] = useState('');
    const [newPhraseHotkey, setNewPhraseHotkey] = useState(null);

    const handleSave = async (phrase) => {
        await addOrUpdatePhrase(phrase);
        setEditingId(null);
        setEditText('');
        setEditHotkey(null);
    };

    const handleDelete = async (id) => {
        if (window.confirm('确定删除这条常用语吗？')) {
            await deletePhrase(id);
        }
    };

    const handleAdd = async () => {
        if (!newPhraseText.trim()) return;
        const nextId = await getNextPhraseId();
        const defaultHotkey = { modifiers: ['Alt'], key: 'KeyT', shortcut: 'Alt+T' };
        await addOrUpdatePhrase({
            id: nextId,
            phrase: newPhraseText,
            hotkey: defaultHotkey
        });
        setShowAdd(false);
        setNewPhraseText('');
        setNewPhraseHotkey(null);
    };

    const startCapture = (type) => {
        setCapturingHotkey(type);
        window.addEventListener('keydown', handleKeyDown);
    };

    const stopCapture = () => {
        setCapturingHotkey(false);
        window.removeEventListener('keydown', handleKeyDown);
    };

    const handleKeyDown = (e) => {
        const modifiers = [];
        if (e.ctrlKey) modifiers.push('Control');
        if (e.altKey) modifiers.push('Alt');
        if (e.shiftKey) modifiers.push('Shift');
        if (e.metaKey) modifiers.push('Meta');

        const key = e.code;
        if (['ControlLeft', 'ControlRight', 'AltLeft', 'AltRight', 'ShiftLeft', 'ShiftRight', 'MetaLeft', 'MetaRight'].includes(key)) return;

        if (modifiers.length === 0) return;

        const shortcut = `${modifiers.map(m => m === 'Control' ? 'Ctrl' : m === 'Meta' ? 'Win' : m).join('+')}+${key.replace('Key', '').replace('Digit', '')}`;
        const hotkey = { modifiers, key, shortcut };

        if (capturingHotkey === 'edit') {
            setEditHotkey(hotkey);
        } else if (capturingHotkey === 'new') {
            setNewPhraseHotkey(hotkey);
        }
        stopCapture();
    };

    const hotkeyDisplay = (hk) => {
        if (!hk) return '点击设置';
        return hk.shortcut;
    };

    return (
        <div className="h-full flex flex-col gap-6 p-6 ">
            <motion.div
                className="w-full bg-white dark:bg-zinc-900 rounded-2xl p-6 border border-zinc-200 dark:border-zinc-800 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.1)] backdrop-blur-sm"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <div className="flex items-center justify-between mb-6">
                    <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">常用语</h1>
                    <button
                        onClick={() => setShowAdd(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-lg hover:bg-zinc-700 dark:hover:bg-zinc-200 transition-colors"
                    >
                        <Plus className="w-5 h-5" />
                        添加常用语
                    </button>
                </div>

                {showAdd && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-6 p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-200 dark:border-zinc-700"
                    >
                        <div className="flex flex-col gap-4">
                            <div>
                                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">常用语内容</label>
                                <textarea
                                    value={newPhraseText}
                                    onChange={(e) => setNewPhraseText(e.target.value)}
                                    rows={3}
                                    className="w-full px-4 py-2 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:border-transparent"
                                    placeholder="输入常用语内容..."
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">快捷键</label>
                                <button
                                    onClick={() => startCapture('new')}
                                    className={`w-full px-4 py-2 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-600 rounded-lg text-left transition-colors ${newPhraseHotkey ? 'border-zinc-500' : ''}`}
                                >
                                    <span className={newPhraseHotkey ? 'text-zinc-900 dark:text-white font-mono' : 'text-zinc-500'}>
                                        {hotkeyDisplay(newPhraseHotkey)}
                                    </span>
                                </button>
                            </div>
                            <div className="flex justify-end gap-2">
                                <button
                                    onClick={() => { setShowAdd(false); setNewPhraseText(''); setNewPhraseHotkey(null); }}
                                    className="px-4 py-2 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                                >
                                    取消
                                </button>
                                <button
                                    onClick={handleAdd}
                                    disabled={!newPhraseText.trim()}
                                    className="px-4 py-2 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-lg hover:bg-zinc-700 dark:hover:bg-zinc-200 transition-colors disabled:opacity-50"
                                >
                                    添加
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}

                <div className="overflow-auto">
                    <table className="min-w-full">
                        <thead>
                            <tr className="border-b border-zinc-200 dark:border-zinc-800">
                                <th className="py-3 text-left text-sm font-medium text-zinc-500 dark:text-zinc-400">
                                    文字
                                </th>
                                <th className="py-3 text-left text-sm font-medium text-zinc-500 dark:text-zinc-400">
                                    快捷键
                                </th>
                                <th className="py-3 text-left text-sm font-medium text-zinc-500 dark:text-zinc-400">
                                    操作
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                            {phrases.map((item) => (
                                <tr key={item.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                                    <td className="py-4">
                                        {editingId === item.id ? (
                                            <textarea
                                                value={editText}
                                                onChange={(e) => setEditText(e.target.value)}
                                                rows={2}
                                                className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:border-transparent text-sm"
                                                autoFocus
                                            />
                                        ) : (
                                            <span className="text-zinc-900 dark:text-white">{item.phrase}</span>
                                        )}
                                    </td>
                                    <td className="py-4">
                                        {editingId === item.id ? (
                                            <button
                                                onClick={() => startCapture('edit')}
                                                className={`w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-600 rounded-lg text-left transition-colors ${editHotkey ? 'border-zinc-500' : ''}`}
                                            >
                                                <span className={editHotkey ? 'text-zinc-900 dark:text-white font-mono text-sm' : 'text-zinc-500 text-sm'}>
                                                    {hotkeyDisplay(editHotkey)}
                                                </span>
                                            </button>
                                        ) : (
                                            <span className="px-3 py-2 bg-zinc-100 dark:bg-zinc-800 rounded-lg text-base font-bold text-zinc-600 dark:text-zinc-300 shadow-sm hover:shadow-md transition-shadow border border-zinc-200 dark:border-zinc-700">
                                                {item.hotkey.shortcut}
                                            </span>
                                        )}
                                    </td>
                                    <td className="py-4">
                                        {editingId === item.id ? (
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => {
                                                        const hotkey = editHotkey || item.hotkey;
                                                        handleSave({ ...item, phrase: editText, hotkey });
                                                    }}
                                                    className="px-3 py-1.5 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-lg hover:bg-zinc-700 dark:hover:bg-zinc-200 transition-colors text-sm"
                                                >
                                                    <Save className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        setEditingId(null);
                                                        setEditText('');
                                                        setEditHotkey(null);
                                                    }}
                                                    className="px-3 py-1.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors text-sm"
                                                >
                                                    <Cancel className="w-4 h-4" />
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => {
                                                        setEditingId(item.id);
                                                        setEditText(item.phrase);
                                                        setEditHotkey(null);
                                                    }}
                                                    className="px-3 py-1.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors text-sm"
                                                    title="编辑"
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(item.id)}
                                                    className="px-3 py-1.5 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors text-sm"
                                                    title="删除"
                                                >
                                                    <Trash className="w-4 h-4" />
                                                </button>
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </motion.div>
        </div>
    );
} 