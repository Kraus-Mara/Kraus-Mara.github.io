{
  inputs,
  username,
  host,
  ...
}:

let
  importAllDefaultNixRecursive =
    dir:
    let
      _ = builtins.trace "Importing from: ${toString dir}" null;
      entries = builtins.readDir dir;
      dirs = builtins.filter (name: entries.${name} == "directory") (builtins.attrNames entries);
      importCurrent =
        if builtins.hasAttr "default.nix" entries && entries."default.nix" == "regular" then
          [ (import (dir + "/default.nix")) ] # If there's a default.nix in a dir
        else
          map (file: import (builtins.toString dir + "/${file}")) (
            builtins.filter (file: builtins.match ".*\\.nix" file != null) (builtins.attrNames entries)
          );
      importSubdirs = builtins.concatLists (
        map (subdir: importAllDefaultNixRecursive (dir + "/${subdir}")) dirs
      );
    in
    importCurrent ++ importSubdirs;
in
let
  imported = importAllDefaultNixRecursive ./home;
in
builtins.trace "Imported module: ${toString (builtins.length imported)}" {
  imports = imported;
}
