#!/bin/bash

INSTALL_SKILLS_SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
INSTALL_SKILLS_REPO_ROOT="$(cd "${INSTALL_SKILLS_SCRIPT_DIR}/../../.." && pwd)"
INSTALL_SKILLS_DIR="${INSTALL_SKILLS_REPO_ROOT}/skills"

install_skills_print_error() {
    printf '\033[0;31mError: %s\033[0m\n' "$1" >&2
}

install_skills_print_success() {
    printf '\033[0;32m[OK] %s\033[0m\n' "$1"
}

install_skills_print_warning() {
    printf '\033[1;33m[WARN] %s\033[0m\n' "$1"
}

install_skills_user_dir() {
    if [[ -n "${APPDATA:-}" ]]; then
        if command -v cygpath >/dev/null 2>&1; then
            cygpath -u "$APPDATA"
        else
            printf '%s\n' "$APPDATA"
        fi
        return 0
    fi

    if [[ -n "${HOME:-}" ]]; then
        printf '%s\n' "$HOME"
        return 0
    fi

    install_skills_print_error "Unable to determine a user directory"
    return 1
}

install_skills_get_agent_path() {
    local agent="$1"
    local base_dir

    base_dir="$(install_skills_user_dir)"

    case "$agent" in
        claude)
            printf '%s\n' "${base_dir}/.claude/skills"
            ;;
        cursor)
            printf '%s\n' "${base_dir}/.cursor/skills"
            ;;
        copilot)
            printf '%s\n' "${base_dir}/.github/skills"
            ;;
        pi)
            printf '%s\n' "${base_dir}/.pi/agent/skills"
            ;;
        antigravity)
            printf '%s\n' "${base_dir}/.antigravity/agent/skills"
            ;;
        *)
            install_skills_print_error "Unknown agent: $agent"
            return 1
            ;;
    esac
}

install_skills_inventory() {
    local callback="$1"
    local filter_skill="${2:-}"
    shift 2

    local skill_dir
    local skill_name
    local skill_file
    local description

    if [[ ! -d "$INSTALL_SKILLS_DIR" ]]; then
        install_skills_print_error "Skills directory not found: $INSTALL_SKILLS_DIR"
        return 1
    fi

    for skill_dir in "${INSTALL_SKILLS_DIR}"/*; do
        [[ -d "$skill_dir" ]] || continue

        skill_name="$(basename "$skill_dir")"
        skill_file="${skill_dir}/SKILL.md"

        [[ -f "$skill_file" ]] || continue

        description="$(awk '/^description:/ {sub(/^description:[[:space:]]*/, "", $0); print; exit}' "$skill_file")"
        if [[ -n "$filter_skill" ]] && [[ "$skill_name" != "$filter_skill" ]]; then
            continue
        fi

        "$callback" "$skill_name" "$skill_dir" "$description" "$@" || return 1
    done
}

install_skills_list_skill() {
    local skill_name="$1"
    local skill_dir="$2"
    local description="$3"

    printf '  - %s -- %s\n' "$skill_name" "$description"
    INSTALL_SKILLS_LIST_COUNT=$((INSTALL_SKILLS_LIST_COUNT + 1))
}

install_skills_list() {
    echo "Available skills in ${INSTALL_SKILLS_DIR}:"

    INSTALL_SKILLS_LIST_COUNT=0
    install_skills_inventory install_skills_list_skill || return 1

    if [[ $INSTALL_SKILLS_LIST_COUNT -eq 0 ]]; then
        install_skills_print_warning "No valid skills found (missing SKILL.md)"
    fi

    return 0
}

install_skills_validate_skill() {
    local skill_name="$1"
    local skill_dir="${INSTALL_SKILLS_DIR}/${skill_name}"
    local skill_file="${skill_dir}/SKILL.md"

    if [[ ! -d "$skill_dir" ]]; then
        install_skills_print_error "Skill directory not found: $skill_dir"
        return 1
    fi

    if [[ ! -f "$skill_file" ]]; then
        install_skills_print_error "SKILL.md not found in $skill_dir"
        return 1
    fi

    return 0
}

install_skills_instance() {
    local skill_name="$1"
    local skill_src="$2"
    local description="$3"
    local dest_dir="$4"
    local use_symlink="$5"
    local skill_dest="${dest_dir}/${skill_name}"

    if [[ ! -d "$skill_src" ]] || [[ ! -f "${skill_src}/SKILL.md" ]]; then
        install_skills_print_error "Invalid skill source: $skill_src"
        INSTALL_SKILLS_INSTALL_FAILED=$((INSTALL_SKILLS_INSTALL_FAILED + 1))
        return 1
    fi

    if [[ -L "$skill_dest" ]] || [[ -d "$skill_dest" ]]; then
        rm -rf "$skill_dest"
    fi

    mkdir -p "$dest_dir"

    if [[ "$use_symlink" == true ]]; then
        ln -s "$skill_src" "$skill_dest"
        install_skills_print_success "Symlinked $skill_name to $skill_dest"
    else
        cp -r "$skill_src" "$skill_dest"
        install_skills_print_success "Copied $skill_name to $skill_dest"
    fi

    INSTALL_SKILLS_INSTALL_MATCHES=$((INSTALL_SKILLS_INSTALL_MATCHES + 1))
    INSTALL_SKILLS_INSTALL_INSTALLED=$((INSTALL_SKILLS_INSTALL_INSTALLED + 1))
    return 0
}

install_skills_install() {
    local dest_dir="$1"
    local skill_name="$2"
    local install_all="$3"
    local use_symlink="$4"
    local installed=0
    local failed=0
    local filter_skill=""

    echo "Installing to: $dest_dir"
    if [[ "$use_symlink" == true ]]; then
        echo "Mode: Symlink"
    else
        echo "Mode: Copy"
    fi
    echo ""

    if [[ "$install_all" != true ]] && [[ -n "$skill_name" ]]; then
        filter_skill="$skill_name"
    fi

    INSTALL_SKILLS_INSTALL_MATCHES=0
    INSTALL_SKILLS_INSTALL_INSTALLED=0
    INSTALL_SKILLS_INSTALL_FAILED=0
    install_skills_inventory install_skills_instance "$filter_skill" "$dest_dir" "$use_symlink" || return 1

    installed="$INSTALL_SKILLS_INSTALL_INSTALLED"
    failed="$INSTALL_SKILLS_INSTALL_FAILED"

    if [[ -n "$filter_skill" ]] && [[ $INSTALL_SKILLS_INSTALL_MATCHES -eq 0 ]]; then
        install_skills_print_error "Skill not found: $skill_name"
        return 1
    fi

    echo ""
    echo "Installation complete:"
    install_skills_print_success "$installed skill(s) installed"

    if [[ $failed -gt 0 ]]; then
        install_skills_print_warning "$failed skill(s) failed"
        return 1
    fi

    return 0
}
