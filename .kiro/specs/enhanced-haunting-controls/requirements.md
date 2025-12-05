# Requirements Document

## Introduction

The Enhanced Haunting Controls feature extends the existing Haunted Home Orchestrator with advanced device management, orchestrator settings, and immersive UI feedback. This enhancement provides users with granular control over individual devices, customizable orchestrator behavior, and real-time visual feedback during haunting sessions. The system builds upon the existing MVP to deliver a more sophisticated and engaging haunted house experience.

## Glossary

- **Device Toggle**: A UI control that allows users to manually enable or disable individual devices for haunting mode
- **Frequency Setting**: A configuration option that controls how often the orchestrator selects a specific device for actions (infrequent, normal, frequent)
- **Scene Setup**: The initial phase of haunting where the orchestrator systematically configures each device to establish the haunted atmosphere
- **Random Triggers**: The ongoing phase of haunting where the orchestrator randomly selects devices for actions at configurable intervals
- **Orchestrator Settings**: User-configurable parameters that control the timing and behavior of the haunting system
- **Epilepsy Mode**: A safety setting that prevents flashing lights and rapid visual changes in both device actions and UI elements
- **Device Tile**: A large visual representation of a device in the haunting interface that shows real-time status and activity
- **Ghost Indicator**: An animated visual element that appears when a device is being acted upon, showing the action being performed
- **Speech Bubble**: A UI element that displays the specific action or command being sent to a device
- **Custom Device Prompt**: A user-editable text prompt that defines how a specific device should behave during haunting
- **Default Device Prompt**: An automatically generated prompt based on device type that defines standard spooky behaviors

## Requirements

### Requirement 1

**User Story:** As a user, I want to manually control which devices participate in haunting mode, so that I can quickly enable or disable specific devices without going through the full setup process.

#### Acceptance Criteria

1. WHEN a user views the devices page THEN the Web Interface SHALL display a toggle switch next to each configured device
2. WHEN a user clicks a device toggle THEN the Web Interface SHALL immediately update the device's enabled state and persist the change
3. WHEN a device is disabled via toggle THEN the Orchestrator SHALL exclude that device from all haunting activities
4. WHEN a device is enabled via toggle THEN the Orchestrator SHALL include that device in future haunting activities
5. WHILE the haunting is active THEN toggle changes SHALL take effect immediately without requiring a restart

### Requirement 2

**User Story:** As a user, I want to configure individual device settings, so that I can customize how frequently each device is used during haunting.

#### Acceptance Criteria

1. WHEN a user clicks on a device THEN the Web Interface SHALL display a settings modal for that device
2. WHEN viewing device settings THEN the Web Interface SHALL show the current frequency setting (infrequent, normal, frequent)
3. WHEN a user changes the frequency setting THEN the Web Interface SHALL save the new setting and update the device configuration
4. WHEN the Orchestrator selects random devices THEN the Orchestrator SHALL weight device selection based on their frequency settings
5. WHERE frequency is set to infrequent THEN the Orchestrator SHALL select that device 50% less often than normal frequency devices

### Requirement 3

**User Story:** As a user, I want the haunting to begin with a coordinated scene setup, so that all devices are properly configured before random actions begin.

#### Acceptance Criteria

1. WHEN a user starts haunting THEN the Orchestrator SHALL immediately begin scene setup phase before random triggers
2. WHEN scene setup begins THEN the Orchestrator SHALL call each sub-agent sequentially for each enabled device they manage
3. WHEN a sub-agent receives a scene setup request THEN the Sub-Agent SHALL generate an initial configuration command for that device
4. WHEN all devices have been configured THEN the Orchestrator SHALL transition to the random triggers phase
5. WHILE scene setup is active THEN the Web Interface SHALL display progress indicating which devices are being configured

### Requirement 4

**User Story:** As a user, I want to control the timing of random haunting events, so that I can adjust the intensity and pacing of the experience.

#### Acceptance Criteria

1. WHEN a user accesses orchestrator settings THEN the Web Interface SHALL display minimum and maximum time controls for random triggers
2. WHEN a user sets minimum trigger time THEN the Orchestrator SHALL wait at least that duration between random device actions
3. WHEN a user sets maximum trigger time THEN the Orchestrator SHALL not exceed that duration between random device actions
4. WHEN random trigger timing is configured THEN the Orchestrator SHALL use random intervals within the specified range
5. WHERE minimum time equals maximum time THEN the Orchestrator SHALL use fixed intervals at that duration

### Requirement 5

**User Story:** As a user with epilepsy concerns, I want enhanced epilepsy mode controls, so that the system prevents flashing lights in both device actions and UI elements.

#### Acceptance Criteria

1. WHEN epilepsy mode is enabled THEN the Orchestrator SHALL include anti-flashing prompts in all sub-agent system prompts
2. WHEN epilepsy mode is enabled THEN the Web Interface SHALL disable all flashing or rapidly changing visual effects
3. WHEN epilepsy mode is enabled THEN device tiles SHALL use steady color changes instead of flickering animations
4. WHEN epilepsy mode is enabled THEN ghost indicators SHALL appear with smooth fade transitions only
5. WHILE epilepsy mode is active THEN all visual feedback SHALL maintain changes below 3 Hz frequency

### Requirement 6

**User Story:** As a user, I want to see large visual tiles for each device during haunting, so that I can easily monitor which devices are active and their current status.

#### Acceptance Criteria

1. WHEN haunting is active THEN the Web Interface SHALL display large tiles for each enabled device
2. WHEN a device tile is displayed THEN the Web Interface SHALL show device name, type, current status, and last action
3. WHEN a device is being acted upon THEN the Web Interface SHALL visually flicker or highlight that device's tile
4. WHEN a device action completes THEN the Web Interface SHALL update the tile to reflect the new device state
5. WHERE devices are numerous THEN the Web Interface SHALL arrange tiles in a responsive grid layout

### Requirement 7

**User Story:** As a user, I want to see ghost animations when devices are being controlled, so that the interface provides engaging feedback about what actions are happening.

#### Acceptance Criteria

1. WHEN a command is sent to a device THEN the Web Interface SHALL display a ghost animation near that device's tile
2. WHEN a ghost appears THEN the Web Interface SHALL show a speech bubble containing the action being performed
3. WHEN a ghost is displayed THEN the Web Interface SHALL fade out the ghost over a 10-second duration
4. WHEN multiple devices are acted upon simultaneously THEN the Web Interface SHALL display multiple ghosts without overlap
5. WHILE epilepsy mode is enabled THEN ghost animations SHALL use smooth transitions without rapid movements

### Requirement 8

**User Story:** As a user, I want to access a dedicated settings page for orchestrator configuration, so that I can fine-tune the haunting behavior in one centralized location.

#### Acceptance Criteria

1. WHEN a user navigates to settings THEN the Web Interface SHALL display all orchestrator configuration options
2. WHEN viewing settings THEN the Web Interface SHALL show current values for minimum time, maximum time, and epilepsy mode
3. WHEN a user modifies settings THEN the Web Interface SHALL validate that minimum time is less than or equal to maximum time
4. WHEN settings are saved THEN the Orchestrator SHALL apply the new configuration to active haunting sessions immediately
5. WHERE invalid settings are entered THEN the Web Interface SHALL display validation errors and prevent saving

### Requirement 9

**User Story:** As a user, I want device frequency settings to persist across sessions, so that my customizations are remembered for future haunting experiences.

#### Acceptance Criteria

1. WHEN a user sets device frequency THEN the Web Interface SHALL store the setting in the device configuration permanently
2. WHEN a user returns to the application THEN the Web Interface SHALL display previously configured frequency settings
3. WHEN devices are used in haunting THEN the Orchestrator SHALL apply the stored frequency weights consistently
4. WHEN a device is deleted and recreated THEN the Web Interface SHALL reset frequency to the default normal setting
5. WHERE frequency settings exist THEN the Orchestrator SHALL preserve these settings during system updates

### Requirement 10

**User Story:** As a user, I want to customize the prompts that control how each device behaves, so that I can fine-tune the spooky actions for my specific devices and preferences.

#### Acceptance Criteria

1. WHEN a light device is first added THEN the Orchestrator SHALL generate a default prompt to set dim lighting with Halloween colors (purple, orange, candlelight whites)
2. WHEN a speaker device is first added THEN the Orchestrator SHALL generate a default prompt to play spooky sounds (crow caws, screams, ghost noises, wind, "Spooky Scary Skeletons")
3. WHEN a television device is first added THEN the Orchestrator SHALL generate a default prompt to find and play "haunted house atmosphere" videos from YouTube
4. WHEN an on/off device is first added THEN the Orchestrator SHALL generate a default prompt to randomly turn the device on or off
5. WHEN viewing device settings THEN the Web Interface SHALL display the current custom prompt for that device in an editable text area
6. WHEN a user modifies a device prompt THEN the Web Interface SHALL save the custom prompt and associate it with that specific device
7. WHEN the Orchestrator acts on a device THEN the Sub-Agent SHALL use the device's custom prompt instead of the generic type-based prompt
8. WHERE no custom prompt exists THEN the Sub-Agent SHALL use the default generated prompt for that device type

### Requirement 11

**User Story:** As a user, I want the scene setup phase to be visually distinct from random triggers, so that I can understand what phase of haunting is currently active.

#### Acceptance Criteria

1. WHEN scene setup begins THEN the Web Interface SHALL display a distinct visual indicator showing "Setting the Scene"
2. WHEN scene setup is active THEN the Web Interface SHALL show progress through the device list
3. WHEN scene setup completes THEN the Web Interface SHALL transition to show "Haunting Active" status
4. WHEN random triggers begin THEN the Web Interface SHALL update the status indicator accordingly
5. WHILE scene setup is running THEN device tiles SHALL show setup-specific animations distinct from random trigger animations