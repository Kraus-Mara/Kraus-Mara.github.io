{
  description = "Kraus-Mara NixOS Configuration";
  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";

    nur.url = "github:nix-community/NUR";
    nixvim = {
      url = "github:nix-community/nixvim";
      inputs.nixpkgs.follows = "nixpkgs";
    };

    hypr-contrib.url = "github:hyprwm/contrib";
    hypr-contrib.inputs.nixpkgs.follows = "nixpkgs";

    hyprpicker.url = "github:hyprwm/hyprpicker";
    hyprpicker.inputs.nixpkgs.follows = "nixpkgs";

    nix-gaming.url = "github:fufexan/nix-gaming";

    hyprland.url = "github:hyprwm/Hyprland";
    hyprland.inputs.nixpkgs.follows = "nixpkgs";

    home-manager = {
      url = "github:nix-community/home-manager";
      inputs.nixpkgs.follows = "nixpkgs";
    };

    spicetify-nix = {
      url = "github:Gerg-L/spicetify-nix";
      inputs.nixpkgs.follows = "nixpkgs";
    };

    lazyvim.url = "github:pfassina/lazyvim-nix";

    nix-flatpak.url = "github:gmodena/nix-flatpak";

    nvf.url = "github:notashelf/nvf";
  };

  outputs =
    {
      nixpkgs,
      self,
      ...
    }@inputs:
    let
      username = "kraus";
      system = "x86_64-linux";
      # ------ to allow bottles to build
      patoolOverlay = final: prev: {
        pythonPackagesExtensions = prev.pythonPackagesExtensions ++ [
          (pythonFinal: pythonPrev: {
            patool = pythonPrev.patool.overrideAttrs (oldAttrs: {
              doCheck = false;
            });
          })
        ];
      };
      sharedModules = [
        {
          nixpkgs.overlays = [ patoolOverlay ];
        }
      ];
      # ------
    in
    {
      nixosConfigurations = {
        default = "os";
        desktop = nixpkgs.lib.nixosSystem {
          inherit system;
          modules = sharedModules ++ [ ./hosts/desktop ];
          specialArgs = {
            host = "desktop";
            inherit self inputs username;
          };
        };

        os = nixpkgs.lib.nixosSystem {
          inherit system;
          modules = sharedModules ++ [ ./hosts/os ];
          specialArgs = {
            host = "os";
            inherit self inputs username;
          };
        };

        laptop = nixpkgs.lib.nixosSystem {
          inherit system;
          modules = sharedModules ++ [ ./hosts/laptop ];
          specialArgs = {
            host = "laptop";
            inherit self inputs username;
          };
        };

        vm = nixpkgs.lib.nixosSystem {
          inherit system;
          modules = sharedModules ++ [ ./hosts/vm ];
          specialArgs = {
            host = "vm";
            inherit self inputs username;
          };
        };
      };
    };
}
