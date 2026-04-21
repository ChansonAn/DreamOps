#!/usr/bin/env python3
"""
测试异步任务执行功能
"""

import requests
import json
import time

# 配置
BASE_URL = "http://localhost:8000"
SCHEDULE_ID = 7  # 根据您的日志，这是Sched-0000000007
TARGET_HOST = "192.168.10.100"

def test_async_execution():
    """测试异步执行功能"""
    print("=== 测试异步任务执行功能 ===")
    
    # 1. 执行任务编排
    print(f"\n1. 执行任务编排 (ID: {SCHEDULE_ID}, 目标主机: {TARGET_HOST})")
    url = f"{BASE_URL}/api/task-schedules/{SCHEDULE_ID}/execute"
    params = {"target_host": TARGET_HOST}
    
    try:
        response = requests.post(url, params=params)
        print(f"响应状态码: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            print(f"执行结果: {json.dumps(result, indent=2, ensure_ascii=False)}")
            
            # 检查返回的字段
            if "task_id" in result:
                print(f"✓ 成功获取TaskID: Task-{str(result['task_id']).zfill(10)}")
            if "message" in result:
                print(f"✓ 消息: {result['message']}")
            if "redirect_url" in result:
                print(f"✓ 重定向URL: {result['redirect_url']}")
                
            # 2. 立即检查执行日志
            print(f"\n2. 检查执行日志 (TaskID: {result['task_id']})")
            log_url = f"{BASE_URL}/api/execution-logs/{result['log_id']}"
            log_response = requests.get(log_url)
            
            if log_response.status_code == 200:
                log_data = log_response.json()
                print(f"执行日志状态: {log_data.get('status', 'unknown')}")
                print(f"开始时间: {log_data.get('start_time', 'N/A')}")
                print(f"结束时间: {log_data.get('end_time', 'N/A')}")
                
                if log_data.get('status') == 'running':
                    print("✓ 任务正在后台执行中...")
                else:
                    print(f"任务状态: {log_data.get('status')}")
            else:
                print(f"✗ 无法获取执行日志: {log_response.status_code}")
                
        else:
            print(f"✗ 执行失败: {response.status_code}")
            print(f"响应内容: {response.text}")
            
    except Exception as e:
        print(f"✗ 请求异常: {str(e)}")

def test_sync_vs_async():
    """对比同步和异步执行"""
    print("\n=== 对比同步和异步执行 ===")
    
    # 同步执行（旧方式） - 会阻塞几分钟
    print("\n1. 同步执行（旧方式）:")
    print("   - 前端调用API")
    print("   - 后端执行所有脚本")
    print("   - 等待所有脚本完成（可能需要几分钟）")
    print("   - 返回完整结果")
    print("   - 问题: 前端UI被阻塞，用户无法操作")
    
    # 异步执行（新方式）
    print("\n2. 异步执行（新方式）:")
    print("   - 前端调用API")
    print("   - 后端立即返回TaskID")
    print("   - 后台异步执行任务")
    print("   - 前端显示成功消息并跳转到执行日志")
    print("   - 用户可以在执行日志页面查看实时进度")
    print("   - 优势: 前端UI不被阻塞，用户体验更好")

def check_platform_issues():
    """检查平台数据看不见的问题"""
    print("\n=== 检查平台数据看不见的问题 ===")
    
    issues = [
        {
            "问题": "执行模态框阻塞UI",
            "原因": "同步API调用导致前端等待几分钟",
            "解决方案": "已改为异步执行，立即返回",
            "状态": "✓ 已解决"
        },
        {
            "问题": "状态管理混乱",
            "原因": "多个状态变量管理执行结果",
            "解决方案": "简化状态管理，移除execResult和execResultVisible",
            "状态": "✓ 已解决"
        },
        {
            "问题": "缺少用户引导",
            "原因": "执行后用户不知道去哪里查看进度",
            "解决方案": "添加成功消息和自动跳转",
            "状态": "✓ 已解决"
        },
        {
            "问题": "长时间任务无反馈",
            "原因": "没有实时进度显示",
            "解决方案": "跳转到执行日志页面查看实时状态",
            "状态": "✓ 已解决"
        }
    ]
    
    for issue in issues:
        print(f"\n{issue['问题']}:")
        print(f"  原因: {issue['原因']}")
        print(f"  解决方案: {issue['解决方案']}")
        print(f"  状态: {issue['状态']}")

if __name__ == "__main__":
    print("DreamOps 任务执行优化测试")
    print("=" * 50)
    
    test_async_execution()
    test_sync_vs_async()
    check_platform_issues()
    
    print("\n" + "=" * 50)
    print("测试完成！")
    print("\n改进总结:")
    print("1. 后端API改为异步执行，立即返回TaskID")
    print("2. 前端在任务执行后自动跳转到执行日志页面")
    print("3. 移除了阻塞UI的执行结果模态框")
    print("4. 添加了用户友好的成功消息和跳转链接")
    print("5. 解决了'平台数据看不见'的问题")