use serde_json::{json, Value};
use tauri::AppHandle;
use tauri::Manager;
use tauri_plugin_store::StoreExt;

const SETTINGS_FILENAME: &str = "settings.json";
const SCENES_FILENAME: &str = "scenes.json";

// 添加模型配置结构体
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct ModelConfig {
    pub auth: String,
    pub api_url: String,
    pub model_name: String,
}

// 游戏场景结构体
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct GameScene {
    pub id: String,
    pub name: String,
    pub prompt: String,
    pub is_builtin: bool,
}

// 添加常用语结构体
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct Phrase {
    pub id: i32,
    pub phrase: String,
    pub hotkey: HotkeyConfig,
}

// 新增 HotkeyConfig 结构体
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct HotkeyConfig {
    pub modifiers: Vec<String>,
    pub key: String,
    pub shortcut: String,
}

impl HotkeyConfig {
    // 创建平台特定的快捷键配置
    fn new_platform_specific(key: &str) -> Self {
        #[cfg(target_os = "macos")]
        let (modifier, symbol) = ("Meta", "⌘");
        #[cfg(not(target_os = "macos"))]
        let (modifier, symbol) = ("Alt", "Alt");

        Self {
            modifiers: vec![modifier.to_string()],
            key: key.to_string(),
            shortcut: format!("{}+{}", symbol, key.replace("Key", "").replace("Digit", "")),
        }
    }
}

// 应用设置结构体（存储在 settings.json）
#[derive(Debug, serde::Serialize, serde::Deserialize)]
pub struct AppSettings {
    pub trans_hotkey: HotkeyConfig,
    pub translation_from: String,
    pub translation_to: String,
    #[serde(default = "default_active_scene")]
    pub active_scene: String,
    // 保留旧字段兼容已有存储数据
    #[serde(default)]
    pub game_scene: String,
    pub translation_mode: String,
    pub daily_mode: bool,
    pub model_type: String,
    pub custom_model: ModelConfig,
    pub phrases: Vec<Phrase>,
}

// 场景数据结构（存储在 scenes.json）
#[derive(Debug, serde::Serialize, serde::Deserialize)]
pub struct ScenesData {
    pub scenes: Vec<GameScene>,
}

fn default_active_scene() -> String {
    "dota2".to_string()
}

// 构建内置游戏场景列表
fn build_builtin_scenes() -> Vec<GameScene> {
    vec![
        GameScene {
            id: "lol".to_string(),
            name: "英雄联盟".to_string(),
            prompt: "英雄联盟游戏环境\n保留技能和装备简称\n使用赛事解说术语".to_string(),
            is_builtin: true,
        },
        GameScene {
            id: "dota2".to_string(),
            name: "Dota 2".to_string(),
            prompt: "环境: DOTA2\n英雄简称（如ES=撼地神牛）\n物品缩写（如BKB）\n使用赛事解说术语\n保持团战节奏感".to_string(),
            is_builtin: true,
        },
        GameScene {
            id: "csgo".to_string(),
            name: "CS:GO".to_string(),
            prompt: "CS:GO游戏环境\n保留武器和位置代号\n使用标准战术用语".to_string(),
            is_builtin: true,
        },
        GameScene {
            id: "pubg".to_string(),
            name: "PUBG".to_string(),
            prompt: "PUBG游戏环境\n保留武器和载具名称\n使用战术报点用语".to_string(),
            is_builtin: true,
        },
        GameScene {
            id: "apex".to_string(),
            name: "Apex Legends".to_string(),
            prompt: "Apex Legends游戏环境\n保留传奇和技能名称\n使用战术简语".to_string(),
            is_builtin: true,
        },
        GameScene {
            id: "overwatch".to_string(),
            name: "守望先锋".to_string(),
            prompt: "守望先锋游戏环境\n保留英雄和技能名称\n使用团队配合用语".to_string(),
            is_builtin: true,
        },
        GameScene {
            id: "valorant".to_string(),
            name: "Valorant".to_string(),
            prompt: "Valorant游戏环境\n保留特工和技能名称\n使用FPS战术报点用语".to_string(),
            is_builtin: true,
        },
        GameScene {
            id: "fortnite".to_string(),
            name: "Fortnite".to_string(),
            prompt: "Fortnite游戏环境\n保留武器和建筑术语\n使用战术简语".to_string(),
            is_builtin: true,
        },
        GameScene {
            id: "minecraft".to_string(),
            name: "Minecraft".to_string(),
            prompt: "Minecraft游戏环境\n保留方块和物品名称\n使用社区常用表达".to_string(),
            is_builtin: true,
        },
        GameScene {
            id: "warzone".to_string(),
            name: "Warzone".to_string(),
            prompt: "Warzone游戏环境\n保留武器和装备名称\n使用战术报点用语".to_string(),
            is_builtin: true,
        },
        GameScene {
            id: "wow".to_string(),
            name: "魔兽世界".to_string(),
            prompt: "魔兽世界游戏环境\n保留职业、技能和副本术语\n使用MMO社区常用表达".to_string(),
            is_builtin: true,
        },
    ]
}

// 初始化默认设置
pub fn initialize_settings(app: &AppHandle) -> Result<(), anyhow::Error> {
    let settings_store = app.store(SETTINGS_FILENAME)?;
    let scenes_store = app.store(SCENES_FILENAME)?;

    let has_settings = settings_store.get("settings").is_some();
    let has_scenes = scenes_store.get("scenes").is_some();

    // --- 初始化 scenes.json ---
    if !has_scenes {
        let scenes = build_builtin_scenes();
        scenes_store.set("scenes", json!(scenes));
        let _ = scenes_store.save();
    }
    scenes_store.close_resource();

    // --- 初始化 settings.json ---
    if has_settings {
        settings_store.close_resource();
        return Ok(());
    }

    // 创建默认快捷键配置
    let trans_hotkey = HotkeyConfig::new_platform_specific("KeyT");

    // 创建默认常用语配置
    let phrases: Vec<Phrase> = (1..=8).map(|id| {
        let phrase = match id {
            1 => "已使自身本场比赛的积分得失加倍！",
            2 => "由于挂机行为已经被系统从游戏中踢出...",
            3 => "已经放弃了游戏，这场比赛不计入天梯积分，剩余玩家可以自由退出。",
            4 => "由于长时间没有重连至游戏，系统判定他为逃跑。玩家现在离开该场比赛将不会被判定为放弃！",
            5 => "已经放弃了游戏，系统判定他为逃跑。玩家现在离开该场比赛将不会被判定为放弃。",
            6 => "检测到网络的连接情况非常糟糕，本场比赛将不会计入数据。现在可以安全离开比赛。",
            7 => "已经连续258次预测他们队伍将取得胜利！",
            8 => "经系统检测：玩家XXXXXX存在代练或共享账号嫌疑，遵守社区游戏规范，再次违反将进行封禁处理。",
            _ => unreachable!(),
        };
        Phrase {
            id,
            phrase: phrase.to_string(),
            hotkey: HotkeyConfig::new_platform_specific(&format!("Digit{}", id)),
        }
    }).collect();

    let default_settings = json!({
        "trans_hotkey": trans_hotkey,
        "translation_from": "zh",
        "translation_to": "en",
        "active_scene": "dota2",
        "game_scene": "dota2",
        "translation_mode": "toxic",
        "daily_mode": false,
        "model_type": "custom",
        "custom_model": {
            "auth": "",
            "api_url": "https://api.openai.com/v1/chat/completions",
            "model_name": "gpt-3.5-turbo"
        },
        "phrases": phrases
    });

    settings_store.set("settings", default_settings);
    let _ = settings_store.save();
    settings_store.close_resource();

    Ok(())
}

// 获取设置
pub fn get_settings(app: &AppHandle) -> Result<AppSettings, anyhow::Error> {
    let store = app.store(SETTINGS_FILENAME)?;
    let settings: Value = store
        .get("settings")
        .expect("Failed to get value from settings store");
    Ok(serde_json::from_value(settings)?)
}

// 获取场景列表
pub fn get_scenes(app: &AppHandle) -> Result<Vec<GameScene>, anyhow::Error> {
    let store = app.store(SCENES_FILENAME)?;
    let scenes: Value = store
        .get("scenes")
        .unwrap_or(json!(build_builtin_scenes()));
    Ok(serde_json::from_value(scenes)?)
}

// 更新场景列表
pub fn save_scenes(app: &AppHandle, scenes: Vec<GameScene>) -> Result<(), anyhow::Error> {
    let store = app.store(SCENES_FILENAME)?;
    store.set("scenes", json!(scenes));
    store.save()?;
    Ok(())
}

// 更新设置中的特定字段
pub fn update_settings_field<T: serde::Serialize>(
    app: &AppHandle,
    field_updater: impl FnOnce(&mut AppSettings) -> T,
) -> Result<T, anyhow::Error> {
    let store = app.store(SETTINGS_FILENAME)?;
    let mut settings = get_settings(app)?;

    // 更新字段
    let result = field_updater(&mut settings);

    // 保存更新后的设置
    store.set("settings", json!(settings));
    store.save()?;

    Ok(result)
}

// 获取配置文件目录路径
pub fn get_config_dir(app: &AppHandle) -> Result<std::path::PathBuf, anyhow::Error> {
    let path = app.path().app_data_dir()?;
    Ok(path)
}
