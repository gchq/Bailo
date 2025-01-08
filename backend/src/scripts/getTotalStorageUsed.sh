#!/usr/bin/env bash
# Created using Bash Boilerplate: https://github.com/xwmx/bash-boilerplate

# Treat unset variables and parameters other than the special parameters '@' or '*' as an error when performing parameter expansion
set -o nounset
# Exit immediately if a pipeline returns non-zero
set -o errexit
# Print a helpful message if a pipeline with non-zero exit code causes the script to exit as described above
trap 'echo "Aborting due to errexit on line $LINENO. Exit code: $?" >&2' ERR
# Allow the above trap be inherited by all functions in the script
set -o errtrace

# Set $IFS to only newline and tab - see http://www.dwheeler.com/essays/filenames-in-shell.html
IFS=$'\n\t'

_ME="$(basename "${0}")"

# Exit with status 1 after executing the specified command with output redirected to standard error
_exit_1() {
  {
    printf "%s " "$(tput setaf 1)!$(tput sgr0)"
    "${@}"
  } 1>&2
  exit 1
}

# Check required program(s) are installed
if ! command -v jq > /dev/null 2>&1; then
  _exit_1 printf "Error: jq is not installed\\n"
fi

_print_help() {
  cat <<HEREDOC
Display the total amount of storage used by files in Bailo according to MongoDB's data.

Usage:
  ${_ME} [<arguments>]
  ${_ME} -h | --help

Example:
  ${_ME} -b -r json -o usage/file-storage.json

Options:
  -h, --help                Show this screen.
  -b, --bytes               Display the storage usage in bytes. If unset, values are formatted for human readability.
  -o, --output <filename>   Write the results to the specified file. If unset, results are printed to the terminal.
  -r, --reporting-format <format>
                            Set the output format to one of ((c|console)|(j|json)). Defaults to console. When set as json, if <-b|--bytes> is passed then the values are numbers otherwise the values are strings.
HEREDOC
}

# Option parsing
_PRINT_HELP=0

_INCLUDE_DELETED=0
_REPORTING_FORMAT="console"
_NORMALISED_REPORTING_FORMAT=
_FORMAT_BYTES=1
_OUTPUT_TO_FILE=0
_OUTPUT_FILE=

# Given a flag (e.g., -e | --example) return the value or exit 1 if value is blank or appears to be another option
__get_option_value() {
  local __arg="${1:-}"
  local __val="${2:-}"

  if [[ -n "${__val:-}" ]] && [[ ! "${__val:-}" =~ ^- ]]; then
    printf "%s\\n" "${__val}"
  else
    _exit_1 printf "%s requires a valid argument.\\n" "${__arg}"
  fi
}

# Parse the CLI args
while ((${#})); do
  __arg="${1:-}"
  __val="${2:-}"

  case "${__arg}" in
    -h|--help)
      _PRINT_HELP=1
      ;;
    -b|--bytes)
      _FORMAT_BYTES=0
      ;;
    -o|--output)
      _OUTPUT_TO_FILE=1
      _OUTPUT_FILE="$(__get_option_value "${__arg}" "${__val:-}")"
      shift
      ;;
    -r|--reporting-format)
      _REPORTING_FORMAT="$(__get_option_value "${__arg}" "${__val:-}")"
      shift
      ;;
    -*)
      _exit_1 printf "Unexpected option: %s\\n" "${__arg}"
      ;;
  esac

  shift
done

# Parse the _REPORTING_FORMAT value
_REPORTING_FORMAT=$(echo "$_REPORTING_FORMAT" | awk '{print tolower($0)}')
case "${_REPORTING_FORMAT}" in
  c|console)
    _NORMALISED_REPORTING_FORMAT=0
    ;;
  j|json)
    _NORMALISED_REPORTING_FORMAT=1
    ;;
  *)
    _exit_1 printf "Unexpected --reporting-format option: %s\\nShould be one of ((c|console)|(j|json))\\n" "${_REPORTING_FORMAT}"
    ;;
esac

# Main script functionality
_get_storage() {
  # Get the actual mongo values
  tsx_output=$(npm run script -- getTotalStorageUsedMongo)

  # Parse the returned values
  if ((_FORMAT_BYTES)); then
    unformatted_result=$(echo "${tsx_output}" | tail -n 1)
    # Values always end in B for bytes (e.g. GB)
    extraction_regex_suffix="[^B]*B"
  else
    unformatted_result=$(echo "${tsx_output}" | tail -n 2 | head -n 1)
    # Values are always space or close parentheses delimited
    extraction_regex_suffix="[^ )]*"
  fi
  # grep for the value, then cut on the = to get just the value without the text prefix
  existing_bytes=$(echo "${unformatted_result}" | grep -o "existing=${extraction_regex_suffix}" | cut -d '=' -f2-)
  deleted_bytes=$(echo "${unformatted_result}" | grep -o "deleted=${extraction_regex_suffix}" | cut -d '=' -f2-)
  total_bytes=$(echo "${unformatted_result}" | grep -o "total=${extraction_regex_suffix}" | cut -d '=' -f2-)

  # Format the result string
  if [ $_NORMALISED_REPORTING_FORMAT -eq 1 ]; then
    # Use jq to safely (escape key characters etc) create a JSON string
    if ((_FORMAT_BYTES)); then
      result_string=$(jq -n --arg eb "${existing_bytes}" --arg db "${deleted_bytes}" --arg tb "${total_bytes}" '{existing: $eb, deleted: $db, total: $tb}')
    else
      result_string=$(jq -n --arg eb "${existing_bytes}" --arg db "${deleted_bytes}" --arg tb "${total_bytes}" '{existing: ($eb)|tonumber, deleted: ($db)|tonumber, total: ($tb)|tonumber}')
    fi
  elif [ $_NORMALISED_REPORTING_FORMAT -eq 0 ]; then
    result_string="existing: ${existing_bytes}\\ndeleted: ${deleted_bytes}\\ntotal: ${total_bytes}"
  else
    # This shouldn't happen, but better safe than sorry
    _exit_1 printf "Got _NORMALISED_REPORTING_FORMAT=%s\\n" "${_NORMALISED_REPORTING_FORMAT}"
  fi

  # Write the output
  if ((_OUTPUT_TO_FILE)); then
    # Make sure parent directory exists
    mkdir -p "$(dirname "$_OUTPUT_FILE")"
    printf "%b" "${result_string}" > "${_OUTPUT_FILE}"
  else
    printf "%b\\n" "${result_string}"
  fi
}

_main() {
  # Avoid complex option parsing when only one program option is expected
  if ((_PRINT_HELP)); then
    _print_help
  else
    _get_storage "$@"
  fi
}

# Call `_main` after everything has been defined
_main "$@"
