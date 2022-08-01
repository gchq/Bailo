import mimetypes
import os


def get_filename_and_mimetype(full_path_file: str):
    m_type, enc = mimetypes.guess_type(full_path_file)
    filename = os.path.basename(full_path_file)
    return filename, m_type
