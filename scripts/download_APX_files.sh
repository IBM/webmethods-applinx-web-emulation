#!/bin/bash

sandbox="$(get_env SANDBOX)"
downloadPath="$WORKSPACE/$(load_repo app-repo path)"
url="https://aquarius-svl.infra.webmethods.io/PDShare/WWW/$sandbox/data/e2ei/11/"
downloadPath="/mnt/c/Mend_Scans/Third-Party"

if [ "$sandbox" == "dataserveAPX_PI_120may2025" ]; then
    path="/mnt/c/Mend_Scans/Third-Party/VersionCheck/12.0/version.properties"
else
    path="/mnt/c/Mend_Scans/Third-Party/VersionCheck/11.1/version.properties"
fi

# Create download directory if it doesn't exist
# mkdir -p "$downloadPath"

# Read properties file
declare -A properties
while IFS='=' read -r key value; do
    echo "$key=$value"
    properties["$key"]="$value"
done < "$path"

productbuild="APX_12.0.0.0.281"

echo "Product URL : $productbuild"

files=(
    "BM_APXAdministator-ALL-Any.zip"
    "BM_APXAdministator-UNIX-Any.zip"
    "BM_APXAdministator-WNT-Any.zip"
    "BM_APXDotNetFramework-WNT-Any.zip"
    "BM_APXFramework-ALL-Any.zip"
    "BM_APXJSPFramework-ALL-Any.zip"
    "BM_APXServer-ALL-Any.zip"
    "BM_APXServer-UNIX-Any.zip"
    "BM_APXServer-WNT-Any.zip"
    "BM_APXVSAddIn-WNT-Any.zip"
    "BM_APXWorkbench-WNT-Any.zip"
)

if [ "$sandbox" == "dataserveAPX_PI_120may2025" ]; then
    downloadPath="$downloadPath/APX_12.0.0.0"
else
    downloadPath="$downloadPath/APX_11.1.0.0"
fi

# Remove existing folder if it exists
if [ -d "$downloadPath" ]; then
    rm -rf "$downloadPath"
fi

mkdir -p "$downloadPath"

for zipFileName in "${files[@]}"; do
    echo "zipFileName : $zipFileName"
    fileUrl="${url}${productbuild}/bms/${zipFileName}"
    echo "fileUrl : $fileUrl"
    curl -o "$downloadPath/$zipFileName" "$fileUrl"
done
