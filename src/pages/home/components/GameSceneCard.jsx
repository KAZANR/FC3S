import { motion } from 'framer-motion';
import { IMac } from '../../../icons';
import { useStore } from '../../../components/StoreProvider';

export default function GameSceneCard() {
    const { settings, updateSettings } = useStore();

    return (
        <motion.div
            className="relative h-full flex flex-col bg-white dark:bg-zinc-900 rounded-2xl p-6 border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all duration-200 text-left shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.1)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] dark:hover:shadow-[0_8px_30px_rgb(0,0,0,0.2)] backdrop-blur-sm"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
        >
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 text-sm text-zinc-500">
                    <IMac className="w-6 h-6 stroke-zinc-500" />
                    日常模式
                </div>
            </div>
            <div className="flex-1 flex flex-col justify-between mt-4">
                <div className="text-sm text-zinc-400">
                    划词翻译
                </div>
            </div>
        </motion.div>
    );
}