use anyhow::Result;
use reqwest::Client;
use serde_json::{json, Value};
use tauri::AppHandle;

fn get_system_prompt(from: &str, to: &str, scene_prompt: &str, mode: &str, daily_mode: bool, active_scene_id: &str) -> String {
    if daily_mode {
        return format!(
            r#"<task>将用户输入从【{}】翻译到【{}】</task>

<requirements>
1. 直接输出翻译结果，禁止任何解释
2. 单句长度控制在15-25字
3. 确保口语化自然表达
4. 禁止重复/冗余内容
5. 保留数字和专有名词
</requirements>

<style>
• 生活化口语表达
• 符合日常交流习惯
• 自然流畅不生硬
</style>

<output_format>
仅输出一条最终翻译结果，不要包含任何思考过程或解释
</output_format>"#,
            from, to
        );
    }

    let base = format!(
        r#"<task>将游戏内文字从【{}】翻译到【{}】</task>

<constraints>
• 标点限制: ≤5个符号
• 禁止换行
• 禁止Markdown
• 禁止特殊符号
</constraints>

<terms>
• 保留原始游戏术语
• 使用官方译名
• 维持缩写格式
</terms>"#,
        from, to
    );

    let mode_desc = match mode {
        "toxic" => {
            r#"<toxic_style>
• 翻译用户原文后，还需进行2-3句扩写
• 使用中国百度贴吧老哥的大脑进行思考
• 用最为地狱笑话的心态来攻击对手
• 根据目标翻译语言，在翻译的同时加入最为猛烈的地域歧视攻击
• 使用双重隐喻
• 融入游戏场景梗
• 符号化敏感词（如f*ck/cl@ssic）
</toxic_style>

<references>
• COD/堡垒之夜社区
• 百度贴吧风格
• 美式街头俚语
</references>

<rules>
• 每条添加1个战术术语（noob/camping）
• 使用FPS/MOBA黑话重构
</rules>"#
        }
        "pro" => {
            r#"<pro_style>
• 赛事解说风格
• 选手交流简语
• 15字以内短句
• 英文术语优先（如roam）
• 添加战术标记（[推线]/[Gank]）
</pro_style>

<rhythm>
• 0.5秒可读速度
• 去除冗余修饰词
</rhythm>"#
        }
        "auto" => {
            // 根据场景ID推断类型
            let scene_type = if active_scene_id.contains("dota") || active_scene_id.contains("lol") {
                "moba"
            } else if active_scene_id.contains("csgo") || active_scene_id.contains("valorant") || active_scene_id.contains("pubg") || active_scene_id.contains("apex") || active_scene_id.contains("warzone") {
                "fps"
            } else {
                "general"
            };
            
            match scene_type {
                "moba" => {
                    r#"<moba_style>
• 保留英文技能和装备缩写
• 使用MOBA游戏特有黑话
• 转换为选手间的简短指令
• 保持游戏中的交流节奏
</moba_style>"#
                }
                "fps" => {
                    r#"<fps_style>
• 使用FPS战术简称(A1、B2等)
• 转换为标准报点格式
• 保留英文武器代号
• 使用经济术语(eco、force等)
</fps_style>"#
                }
                _ => {
                    r#"<general_style>
• 识别并保留游戏术语
• 转换为玩家间常用表达
• 保持游戏交流的简洁性
</general_style>"#
                }
            }
        }
        _ => "",
    };

    let scene_desc = if scene_prompt.is_empty() {
        String::from(r#"<context>
• 通用游戏环境
• 识别常见游戏用语
• 保持游戏交流特点
</context>"#)
    } else {
        format!(
            r#"<context>
{}
</context>"#,
            scene_prompt
        )
    };

    format!(
        r#"{}
{}
{}

<compliance>
• 严格长度校验
• 术语一致性检查
• 敏感词二次过滤
• 输出格式终检
</compliance>

<output_format>
仅输出一条最终翻译结果，不要包含任何思考过程或解释
</output_format>"#,
        base, mode_desc, scene_desc
    )
}

fn get_model_config(settings: &crate::store::AppSettings) -> crate::store::ModelConfig {
    match settings.model_type.as_str() {
        "siliconflow" => crate::store::ModelConfig {
            auth: "sk-jleighwqdtyssxeycgmwxqrhbofpsbkhtobofxhbeyebupyh".to_string(),
            api_url: "https://api.siliconflow.cn/v1/chat/completions".to_string(),
            model_name: "Qwen/Qwen2-7B-Instruct".to_string(),
        },
        "custom" => settings.custom_model.clone(),
        _ => settings.custom_model.clone(),
    }
}

pub async fn translate_with_gpt(app: &AppHandle, original: &str) -> Result<String> {
    let settings = crate::store::get_settings(app)?;
    let scenes = crate::store::get_scenes(app).unwrap_or_default();
    
    let active_scene_id = settings.active_scene.as_str();
    let scene = scenes.iter().find(|s| s.id == active_scene_id);
    let scene_prompt = scene.map(|s| s.prompt.as_str()).unwrap_or("");

    println!("当前翻译设置:");
    println!("- 源语言: {}", settings.translation_from);
    println!("- 目标语言: {}", settings.translation_to);
    println!("- 游戏场景: {}", active_scene_id);
    println!("- 场景Prompt: {}", scene_prompt);
    println!("- 翻译模式: {}", settings.translation_mode);
    println!("- 日常模式: {}", settings.daily_mode);
    println!("- 模型类型: {}", settings.model_type);

    let model_config = get_model_config(&settings);

    println!("正在发送请求到: {}", model_config.api_url);
    println!("使用的模型: {}", model_config.model_name);
    println!("API密钥前缀: {}", &model_config.auth[..6]);

    let system_prompt = get_system_prompt(
        &settings.translation_from,
        &settings.translation_to,
        scene_prompt,
        &settings.translation_mode,
        settings.daily_mode,
        active_scene_id,
    );

    let client = Client::builder()
        .timeout(std::time::Duration::from_secs(20))
        .connect_timeout(std::time::Duration::from_secs(10))
        .build()?;

    let request_body = json!({
        "model": model_config.model_name,
        "messages": [
            {
                "role": "system",
                "content": system_prompt
            },
            {
                "role": "user",
                "content": original
            }
        ],
        "max_tokens": 300,
        "temperature": 0.3,
        "top_p": 0.3,
        "n": 1,
        "stream": false
    });

    let response = match client
        .post(&model_config.api_url)
        .header("Content-Type", "application/json")
        .header("Authorization", format!("Bearer {}", model_config.auth))
        .json(&request_body)
        .send()
        .await
    {
        Ok(resp) => match resp.json::<Value>().await {
            Ok(json) => {
                // 先检查是否有错误信息
                if let Some(error) = json.get("error_msg").and_then(|msg| msg.as_str()) {
                    println!("API返回错误: {}", error);
                    return Ok(format!("[错误] {}", error));
                }
                // OpenAI/智谱风格的错误对象 {"error": {"message": "..."}}
                if let Some(err_obj) = json.get("error").and_then(|e| e.as_object()) {
                    let msg = err_obj
                        .get("message")
                        .and_then(|m| m.as_str())
                        .unwrap_or("未知API错误");
                    println!("API返回错误: {}", msg);
                    return Ok(format!("[错误] {}", msg));
                }
                json
            }
            Err(e) => {
                println!("解析响应JSON失败: {}", e);
                return Ok(format!("[错误] 服务器响应格式异常: {}", e));
            }
        },
        Err(e) => {
            let error_msg = match e.to_string().as_str() {
                msg if msg.contains("connection refused") => "无法连接到API服务器，请检查网络设置",
                msg if msg.contains("timeout") => "请求超时，请检查网络连接",
                msg if msg.contains("certificate") => "SSL证书验证失败，请检查网络设置",
                _ => "网络请求失败",
            };
            println!("请求失败: {}", e);
            return Ok(format!("[错误] {}", error_msg));
        }
    };

    // 解析响应
    println!("API响应原文: {:?}", response);
    let translated = match response
        .get("choices")
        .and_then(|choices| choices.as_array())
        .and_then(|choices| choices.first())
        .and_then(|choice| choice.get("message"))
        .and_then(|message| message.get("content"))
        .and_then(|content| content.as_str())
    {
        Some(text) => {
            let text = text.trim();
            // 如果找到</think>标签，只保留其后内容
            if let Some(end_pos) = text.find("</think>") {
                text[(end_pos + 8)..].trim().to_string()
            } else {
                text.to_string()
            }
        }
        None => {
            println!("无法从响应中提取翻译结果: {:?}", response);
            return Ok("[错误] 服务器返回的数据格式异常".to_string());
        }
    };

    Ok(translated)
}
