> ### Developed with and for PhD candidate [Fil Botelho@Orpheus Institute](https://orpheusinstituut.be/en/orpheus-research-centre/researchers/filipa-botelho)
> This is part of the experimental_system (**expS**) repositories that are present on this github account.

# 🔉 fb_synth
A `Max/MSP` patch used as the main audio server for the `expS` system. 

### Main characteristics:
> 1. Through [expS_menu](https://github.com/alumiaCoder/expS_menu) and [expS_glove](https://github.com/alumiaCoder/expS_glove) generates and manipulates acoustic feedback in real time.
> 2. Communicates via TCP with any machine in the local network.
> 3. Live audio playback/capture.
> 4. Multi-input/output.
> 5. Live control over compression, distortion, EQ, gain, etc.
> 6. Saves/loads presets for all parameters.
> 7. All parameters have `max`, `min` and `loop` controls

# 💻Requirements
## Hardware
- Fast windows machine to handle live audio processing (was running on a i5-13600k)
- At least one input mic and two output speakers.
- Sound card.
- This machine was communicating will all the other machines through a wired switch.
- 1 GigE was enough across all machines.
   
## Software
- Windows OS
- `Max/MSP` with `node.js` and `gen`

# 🖱️ Use
As mentioned, this patch is part of a bigger (multi-system) project (all repositories belonging to this project have `expS` as a prefix). It constitutes the 
complete signal manipulation path and the backend for live user control over all parameters in the sound signal chain.

This tool is designed to be manipulated through [expS_menu](https://github.com/alumiaCoder/expS_menu). The user can access all parameters,
 manipulate them in real time, start and stop audio (and video) recording, playback audio from a playlist, playback recorded videos, etc. 

If you intend to use this tool, or take some ideas from it, it is better if you contact me. Describing all the capabilities here is less useful than a 
conversation over your needs and how this tool might meet them (see bellow).

# ☮️Keep in mind
- I am sharing this here because some concepts might interest some people. **The code is not made to run first time**. All the system needs to be setup,
with all the credentials and the right hardware.
- If you want to use the code, or explore some idea, it is better if you contact me at: alumiamusic@gmail.com 
