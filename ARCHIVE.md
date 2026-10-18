# GitHub 内容归档

归档仓库：https://github.com/HeySeeTech/Crypto-Charting

运行：`python3 scripts/archive_to_github.py`。

每日文案、Excel、JSON、图表、预览与研究附件按 `archive/YYYY-MM-DD/原工作区相对路径` 保存；相同路径的内容修订保留哈希版本。日期优先读取原路径，否则使用北京时间的文件修改日期。文案数据库每天按版本保存；源代码、规则、素材与参考资料保留本地。

每次产出后执行同步，日报/周报任务也执行。另有每日归档维护任务兜底。只有成功推送并核对远端提交与逐文件内容后，才删除早于北京时间当天的本地生成文件。上传、认证或校验失败均保留本地文件。当天文件不清理。临时 Git 检出会在执行结束时移除，不在本地累积仓库历史。

历史分析按需从 GitHub 的 archive/ 读取原 JSON 与来源；临时下载的资料分析完清理。最近成功记录见本地 `.archive-state/last-success.json`。
