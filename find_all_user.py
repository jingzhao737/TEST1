import json

log_file = r'C:\Users\jackchen\.gemini\antigravity\brain\9a7e12a1-336c-4270-87e5-3e0923309e6a\.system_generated\logs\transcript.jsonl'
with open(log_file, 'r', encoding='utf-8') as f:
    for line in f:
        try:
            data = json.loads(line)
            step = data.get('step_index', 0)
            if step > 614:
                break
            dtype = data.get('type', '')
            if dtype == 'USER_INPUT':
                content = str(data.get('content', ''))
                print(f'Step {step}: {content[:300]}')
                print()
        except:
            pass
