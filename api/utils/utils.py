def convert_keys_to_string(d):
    if isinstance(d, dict):
        return {str(k): convert_keys_to_string(v) for k, v in d.items()}
    elif isinstance(d, list):
        return [convert_keys_to_string(item) for item in d]
    else:
        return d 