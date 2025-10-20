 #!/usr/bin/env bash
 set -euo pipefail

 # sync-template.sh
 # Sync canonical ops-template content into downstream projects listed in registry/projects.yaml
 # Dry-run by default; use -w to write changes.
 # Requires: yq, rsync

 WRITE=false
 QUIET=false
 while getopts ":wq" opt; do
   case $opt in
     w) WRITE=true ;;
     q) QUIET=true ;;
     *) ;;
   esac
 done
 shift $((OPTIND -1))

 ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
 REGISTRY="$ROOT_DIR/registry/projects.yaml"

 if ! command -v yq >/dev/null 2>&1; then
   echo "yq is required (https://github.com/mikefarah/yq)" >&2
   exit 1
 fi
 if ! command -v rsync >/dev/null 2>&1; then
   echo "rsync is required" >&2
   exit 1
 fi

 count=$(yq '.projects | length' "$REGISTRY")
 for ((i=0; i<count; i++)); do
   NAME=$(yq -r ".projects[$i].name" "$REGISTRY")
   DEST=$(yq -r ".projects[$i].path" "$REGISTRY")
   DEST_EXPANDED=$(eval echo "$DEST")
   if ! $QUIET; then echo "==> Project: $NAME ($DEST_EXPANDED)"; fi

   INCLUDE_LIST=($(yq -r ".projects[$i].sync.include[]" "$REGISTRY"))
   EXCLUDE_LIST=($(yq -r ".projects[$i].sync.exclude[]" "$REGISTRY"))
   IS_OPS_MAIN=$(yq -r ".projects[$i].is_ops_main // false" "$REGISTRY")

   RSYNC_ARGS=("-a" "--delete")
   if $QUIET; then RSYNC_ARGS+=("--quiet"); fi
   for ex in "${EXCLUDE_LIST[@]}"; do RSYNC_ARGS+=("--exclude=$ex"); done

   for inc in "${INCLUDE_LIST[@]}"; do
     SRC_PATH="$ROOT_DIR/$inc"

     # Determine destination path based on ops location
     if [[ -d "$DEST_EXPANDED/.agents" ]]; then
       # Ops is in project root
       DEST_PATH="$DEST_EXPANDED/${inc%/**}"
     else
       # Ops is in subfolder
       DEST_PATH="$DEST_EXPANDED/docs/ops-template/${inc%/**}"
     fi

     # Handle special cases for directories that might exist as files
     case "$inc" in
       ".github/.copilot-instructions.md")
         # Ensure .github is a directory, not a file
         if [[ -f "$DEST_PATH" ]]; then
           if ! $QUIET; then echo "   Removing file $DEST_PATH to create directory"; fi
           if $WRITE; then rm "$DEST_PATH"; fi
         fi
         if $WRITE; then mkdir -p "$DEST_PATH"; fi
         ;;
       ".copilot/.gitignore")
         # Ensure .copilot is a directory, not a file
         if [[ -f "$DEST_PATH" ]]; then
           if ! $QUIET; then echo "   Removing file $DEST_PATH to create directory"; fi
           if $WRITE; then rm "$DEST_PATH"; fi
         fi
         if $WRITE; then mkdir -p "$DEST_PATH"; fi
         ;;
       ".github/prompts/")
         if [[ "$IS_OPS_MAIN" == "true" ]]; then
           # Main ops repo gets all prompts
           if ! $QUIET; then echo "   Sync: $inc -> $DEST_PATH (all prompts - main ops repo)"; fi
         else
           # Other repos get only TeamLead and ReleaseManager prompts
           if ! $QUIET; then echo "   Sync: $inc -> $DEST_PATH (selective prompts - project repo)"; fi
           if $WRITE; then
             # Create the destination and sync only specific prompts
             mkdir -p "$DEST_PATH"
             rsync "${RSYNC_ARGS[@]}" --include="TeamLead.prompt.md" --include="ReleaseManager.prompt.md" --exclude="*" "$SRC_PATH" "$DEST_PATH/"
           fi
           continue
         fi
         ;;
       */)
         # Directory sync - ensure destination exists
         if $WRITE; then mkdir -p "$DEST_PATH"; fi
         ;;
       *)
         # File sync - ensure parent directory exists
         PARENT_DIR="$(dirname "$DEST_PATH")"
         if $WRITE; then mkdir -p "$PARENT_DIR"; fi
         ;;
     esac

     if ! $QUIET; then echo "   Sync: $inc -> $DEST_PATH"; fi
     if $WRITE; then
       if [[ "$inc" == */ ]]; then
         # Directory sync
         rsync "${RSYNC_ARGS[@]}" "$SRC_PATH" "$DEST_PATH/"
       else
         # File sync
         rsync "${RSYNC_ARGS[@]}" "$SRC_PATH" "$DEST_PATH"
       fi
     fi
   done
   if ! $WRITE && ! $QUIET; then
     echo "   (dry run) Use -w to write changes"
   fi
   if ! $QUIET; then echo ""; fi
 done