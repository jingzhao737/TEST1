import json

log_file = r'C:\Users\jackchen\.gemini\antigravity\brain\9a7e12a1-336c-4270-87e5-3e0923309e6a\.system_generated\logs\transcript.jsonl'
with open(log_file, 'r', encoding='utf-8') as f:
    for line in f:
        try:
            data = json.loads(line)
            step = data.get('step_index', 0)
            if step < 306 or step > 400:
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
                        tc_str = str(args.get('TargetContent', ''))[:150]
                        rc_str = str(args.get('ReplacementContent', ''))[:150]
                        print(f'Step {step} {name} styles.css:')
                        print(f'  TARGET: {tc_str}')
                        print(f'  REPLACEMENT: {rc_str}')
                        print()
            
            content = data.get('content', '')
            dtype = data.get('type', '')
            if dtype in ['USER_INPUT', 'PLANNER_RESPONSE'] and content:
                print(f'Step {step} {dtype}: {str(content)[:300]}')
                print()
        except:
            pass
