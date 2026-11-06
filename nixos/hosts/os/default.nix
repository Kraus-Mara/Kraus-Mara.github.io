{
  pkgs,
  config,
  inputs,
  ...
}:
{
  imports = [
    ./hardware-configuration.nix
    ./../../modules/core
  ];

  environment.systemPackages = with pkgs; [
    acpi
    brightnessctl
    cpupower-gui
    powertop
  ];

  services = {
    power-profiles-daemon.enable = false;
    upower = {
      enable = true;
      percentageLow = 20;
      percentageCritical = 5;
      percentageAction = 3;
      criticalPowerAction = "PowerOff";
    };

    tlp = {
      enable = true;
      settings = {
        TLP_DEFAULT_MODE = "BAT";
        TLP_PERSISTENT_DEFAULT = 1;

        CPU_ENERGY_PERF_POLICY_ON_AC = "balance_performance";
        CPU_ENERGY_PERF_POLICY_ON_BAT = "power";

        CPU_BOOST_ON_AC = 1;
        CPU_BOOST_ON_BAT = 0;

        CPU_HWP_DYN_BOOST_ON_AC = 1;
        CPU_HWP_DYN_BOOST_ON_BAT = 0;

        PLATFORM_PROFILE_ON_AC = "performance";
        PLATFORM_PROFILE_ON_BAT = "low-power";

        INTEL_GPU_MIN_FREQ_ON_AC = 500;
        INTEL_GPU_MIN_FREQ_ON_BAT = 300;
      };
    };
  };

  boot = {
    kernelModules = [ "acpi_call" ];
    extraModulePackages = with config.boot.kernelPackages; [
      acpi_call
      cpupower
    ];
  };
  specialisation = {
    gnome = {
      inheritParentConfig = true; # All modules/core/ files inherited
      configuration = {
        system.nixos.tags = [ "gnome" ];
        services.desktopManager.gnome.enable = true;
        services.displayManager.sddm = {
          enable = true;
        };
        users.users.kraus = {
          isNormalUser = true;
          uid = 1000;
          extraGroups = [
            "networkmanager"
            "video"
          ];
        };
        services.displayManager.autoLogin = {
          enable = true;
          user = "kraus";
        };
        environment.systemPackages = with pkgs; [
          acpi
          brightnessctl
          cpupower-gui
          powertop
        ];
      };
    };
    plasma = {
      inheritParentConfig = true;
      configuration = {
        system.nixos.tags = [ "plasma" ];
        services.desktopManager.plasma6.enable = true;
        services.displayManager.sddm = {
          enable = true;
        };
        users.users.kraus = {
          isNormalUser = true;
          uid = 1002;
          extraGroups = [
            "networkmanager"
            "video"
          ];
        };
        services.displayManager.autoLogin = {
          enable = true;
          user = "kraus";
        };
        environment.systemPackages = with pkgs; [
          acpi
          brightnessctl
          cpupower-gui
          powertop
        ];
      };
    };
  };
}
