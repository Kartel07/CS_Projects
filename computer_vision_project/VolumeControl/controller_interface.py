from pycaw.pycaw import AudioUtilities

def controller(value):
    # 1. Get the default speakers
    device = AudioUtilities.GetSpeakers()
    
    # 2. Access the volume interface directly (The New Way)
    volume = device.EndpointVolume
    
    
    # 4. Set the volume (-20.0 is the decibel level. 0.0 is max, ~ -65.25 is mute)
    volume.SetMasterVolumeLevel(value, None)
    print(f"Volume forcefully set to {value} dB")

    return volume