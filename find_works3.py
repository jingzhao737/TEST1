import json

log_file = r'C:\Users\jackchen\.gemini\antigravity\brain\9a7e12a1-336c-4270-87e5-3e0923309e6a\.system_generated\logs\transcript.jsonl'
with open(log_file, 'r', encoding='utf-8') as f:
    for line in f:
        try:
            data = json.loads(line)
            step = data.get('step_index', 0)
            if step < 306 or step > 614:
                continue
            
            if 'tool_calls' in data:
                for tc in data['tool_calls']:
                    name = tc['name']
                    args = tc.get('args', {})
                    if type(args) == str:
                        try:
                            args = json.loads(args)
                        except:
                            pass
                    target = args.get('TargetFile', '')
                    if target and 'styles.css' in str(target):
                        rc = str(args.get('ReplacementContent', ''))
                        if 'work-card' in rc or 'work-list' in rc or 'work-name' in rc or 'work-idx' in rc:
                            print(f'Step {step} {name}:')
                            print(f'  REPLACEMENT (first 400 chars): {rc[:400]}')
                            print()
        except:
            pass
