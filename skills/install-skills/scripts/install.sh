#!/bin/bash
set -euo pipefail

# install.sh -- Install skills from aigb-skills to a coding agent's skill directory
# Usage: bash install.sh [OPTIONS]

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=install-core.sh
source "${SCRIPT_DIR}/install-core.sh"

TARGET_AGENT=""
TARGET_PATH=""
SKILL_NAME=""
INSTALL_ALL=false
USE_SYMLINK=false
LIST_ONLY=false

print_help() {
    cat <<EOF
install.sh -- Install aigb-skills to a coding agent

USAGE:
    bash install.sh [OPTIONS]

OPTIONS:
    --target <agent>        Install to agent's skill directory
                           Supported: claude, cursor, copilot, pi, antigravity
    --target-path <path>    Install to custom directory instead
    --skill <name>          Install a single skill (e.g., python-code-style)
    --all                   Install all skills (default)
    --symlink               Create symlinks instead of copying
    --list                  List available skills
    --help                  Show this help message

EXAMPLES:
    # Install all skills to Claude Code (symlinked)
    bash install.sh --target claude --all --symlink

    # Install a single skill to Cursor (copied)
    bash install.sh --target cursor --skill python-code-style

    # Install to custom directory
    bash install.sh --target-path ~/my-skills --all

    # List available skills
    bash install.sh --list

EOF
}

main() {
    while [[ $# -gt 0 ]]; do
        case "$1" in
            --target)
                TARGET_AGENT="$2"
                shift 2
                ;;
            --target-path)
                TARGET_PATH="$2"
                shift 2
                ;;
            --skill)
                SKILL_NAME="$2"
                shift 2
                ;;
            --all)
                INSTALL_ALL=true
                shift
                ;;
            --symlink)
                USE_SYMLINK=true
                shift
                ;;
            --list)
                LIST_ONLY=true
                shift
                ;;
            --help)
                print_help
                exit 0
                ;;
            *)
                install_skills_print_error "Unknown option: $1"
                print_help
                exit 1
                ;;
        esac
    done

    if [[ "$LIST_ONLY" == true ]]; then
        install_skills_list
        exit 0
    fi

    if [[ -n "$TARGET_PATH" ]]; then
        DEST_DIR="$TARGET_PATH"
    elif [[ -n "$TARGET_AGENT" ]]; then
        DEST_DIR="$(install_skills_get_agent_path "$TARGET_AGENT")"
    else
        install_skills_print_error "Must specify --target or --target-path"
        print_help
        exit 1
    fi

    if [[ "$INSTALL_ALL" != true ]] && [[ -z "$SKILL_NAME" ]]; then
        INSTALL_ALL=true
    fi

    install_skills_install "$DEST_DIR" "$SKILL_NAME" "$INSTALL_ALL" "$USE_SYMLINK"
}

main "$@"
