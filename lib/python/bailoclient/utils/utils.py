"""Utils"""

import mimetypes
import os


def get_filename_and_mimetype(full_path_file: str):
    """Get the name and mimetype of a file

    Args:
        full_path_file (str): path of file

    Returns:
        tuple[str, str]: filename and mimetype
    """
    m_type, _ = mimetypes.guess_type(full_path_file)
    filename = os.path.basename(full_path_file)
    return filename, m_type


def minimal_keys_in_dictionary(minimal_dict: dict, dict_2: dict):
    """Check that a dictionary contains all the keys within a minimal dictionary

    Args:
        minimal_dict (dict): Minimal dictionary for checking against
        dict_2 (dict): Dictionary for checking keys
    Returns:
        dict: Result dictionary containing 'valid' and 'error_message' if valid = False
    """
    for key, value in minimal_dict.items():
        try:
            dict_2[key]
        except KeyError:
            return {"valid": False, "error_message": f"must contain '{key}'"}

        model_value = dict_2.get(key)

        if not model_value:
            return {"valid": False, "error_message": f"'{key}' cannot be empty"}

        if isinstance(value, dict) and not isinstance(model_value, dict):
            return {"valid": False, "error_message": f"missing data under '{key}'"}

        if isinstance(value, dict):
            result = minimal_keys_in_dictionary(value, model_value)

            if not result["valid"]:
                return result

    return {"valid": True}
