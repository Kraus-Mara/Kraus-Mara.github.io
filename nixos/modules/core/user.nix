{
  pkgs,
  inputs,
  username,
  host,
  config,
  ...
}:

let
  isGnome = builtins.elem "gnome" config.system.nixos.tags;
  homeImport = if isGnome then ./../parent_gnome_home else ./../parent_home;
in
{
  imports = [ inputs.home-manager.nixosModules.home-manager ];
  home-manager = {
    backupFileExtension = "backup";
    backupCommand = "mv /home/kraus/.gtkrc-2.0 /home/kraus/.gtkrc-2.0.bak";
    useUserPackages = true;
    useGlobalPkgs = true;
    extraSpecialArgs = { inherit inputs username host; };
    users.${username} = {
      imports = [ homeImport ];
      home.username = "${username}";
      home.homeDirectory = "/home/${username}";
      home.stateVersion = "25.11";
      programs.home-manager.enable = true;
    };
  };

  users.users.${username} = {
    isNormalUser = true;
    description = "${username}";
    extraGroups = [
      "cdrom"
      "burn"
      "optical"
      "networkmanager"
      "wheel"
    ];
    shell = pkgs.fish;
  };
  nix.settings.allowed-users = [ "${username}" ];
  nix.settings.trusted-users = [
    "root"
    "${username}"
  ];
  # nix.extraOptions = ''
  #   extra-substituters = https://devenv.cachix.org
  #   extra-trusted-public-keys = devenv.cachix.org-1:w1cLUi8dv3hnoSPGAuibQv+f9TZLr6cv/Hm9XgU50cw=
  # '';
}
