import json

log_file = r'C:\Users\jackchen\.gemini\antigravity\brain\9a7e12a1-336c-4270-87e5-3e0923309e6a\.system_generated\logs\transcript.jsonl'
with open(log_file, 'r', encoding='utf-8') as f:
    for line in f:
        try:
            data = json.loads(line)
            step = data.get('step_index', 0)
            if step != 226:
                continue
            
            if 'tool_calls' in data:
                for tc in data['tool_calls']:
                    args = tc.get('args', {})
                    chunks_raw = args.get('ReplacementChunks', '')
                    chunks = json.loads(chunks_raw, strict=False)
                    for i, chunk in enumerate(chunks):
                        rc = chunk.get('ReplacementContent', '')
                        if 'work-card' in rc or 'work-name' in rc or 'work-idx' in rc or 'work-list' in rc:
                            print(f'Chunk {i}:')
                            print(f'  REPLACEMENT: {rc[:500]}')
                            print()
        except Exception as e:
            import traceback
            traceback.print_exc()
