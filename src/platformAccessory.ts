import {
  AccessoryConfig,
  AccessoryPlugin,
  API,
  CharacteristicEventTypes,
  CharacteristicGetCallback,
  CharacteristicSetCallback,
  CharacteristicValue,
  HAP,
  Logging,
  Service,
} from 'homebridge';

// AirConditionerAPI
// AirConditioner

import { AirConditionerAPI, AirConditioner, State, Mode, Fixation, Fanspeed } from './AirConditionerAPI';

export class AirCondionerAccessory implements AccessoryPlugin {

  private readonly log: Logging;
  private readonly api: API;
  private readonly name: string;
  private airConditionerAPI: AirConditionerAPI;

  private readonly service: Service;
  private readonly informationService: Service;

  constructor(log: Logging, config: AccessoryConfig, api: API) {
    this.log = log;
    this.name = config.name;
    this.api = api;
    const ip: string = config['ip'] as string;
    const mac: string = config['mac'] as string;
    // console.log('ip', ip);
    // console.log('mac', mac);

    // this.Service = this.api.hap.Service;
    // this.Characteristic = this.api.hap.Characteristic;


    this.airConditionerAPI = new AirConditionerAPI(ip, mac);

    this.service = new this.api.hap.Service.Thermostat;
    // this.service.getCharacteristic(api.hap.Characteristic.Active)
    //   .on('get', this.handleActiveGet.bind(this))
    //   .on('set', this.handleActiveSet.bind(this));

    this.service.getCharacteristic(api.hap.Characteristic.CurrentHeatingCoolingState)
      .on('get', this.handleCurrentHeaterCoolerStateGet.bind(this));

    this.service.getCharacteristic(api.hap.Characteristic.TargetHeatingCoolingState)
      .on('get', this.handleTargetHeaterCoolerStateGet.bind(this))
      .on('set', this.handleTargetHeaterCoolerStateSet.bind(this));

    this.service.getCharacteristic(api.hap.Characteristic.CurrentTemperature)
      .on('get', this.handleCurrentTemperatureGet.bind(this));
      
    this.service.getCharacteristic(api.hap.Characteristic.TargetTemperature)
      .on('get', this.handleThresholdTemperatureGet.bind(this))
      .on('set', this.handleThresholdTemperatureSet.bind(this));

    this.service.getCharacteristic(api.hap.Characteristic.TemperatureDisplayUnits)
      .on('get', this.handleTemperatureDisplayUnitsGet.bind(this))
      .on('set', this.handleTemperatureDisplayUnitsSet.bind(this));
    this.service.getCharacteristic(api.hap.Characteristic.TargetTemperature).props.minValue = 16;
    this.service.getCharacteristic(api.hap.Characteristic.TargetTemperature).props.maxValue = 32;
    
    this.informationService = new api.hap.Service.AccessoryInformation()
      .setCharacteristic(api.hap.Characteristic.Manufacturer, 'Custom Manufacturer')
      .setCharacteristic(api.hap.Characteristic.Model, 'Custom Model');

    api.on('didFinishLaunching', () => {
      this.airConditionerAPI.connect();
    });

    setInterval(() => {
      this.airConditionerAPI.getState();
      // this.service.getCharacteristic(this.api.hap.Characteristic.On).setValue(this.airConditionerAPI.model.power === State.on);
    }, 5000);

  }

  getServices(): Service[] {
    return [
      this.informationService,
      this.service,
    ];
  }

  /**
   * Handle requests to get the current value of the "Active" characteristic
   */
  handleActiveGet(callback) {
    this.log.debug('Triggered GET Active');

    // set this to a valid value for Active
    let currentValue = 0;
    if (this.airConditionerAPI.model.power === State.on) {
      currentValue = 1;
    } 
    // const currentValue = 1;

    callback(null, currentValue);
  }

  /**
   * Handle requests to set the "Active" characteristic
   */
  handleActiveSet(value, callback) {
    this.log.debug('Triggered SET Active:', value);
    if (value === 1) {
      this.airConditionerAPI.setPower(State.on);
    } else {
      this.airConditionerAPI.setPower(State.off);
    }
    callback(null);
  }

  /**
   * Handle requests to get the current value of the "Current Heater Cooler State" characteristic
   */
  handleCurrentHeaterCoolerStateGet(callback) {
    this.log.debug('Triggered GET CurrentHeaterCoolerState');

    // set this to a valid value for CurrentHeaterCoolerState
    let currentValue = this.api.hap.Characteristic.CurrentHeatingCoolingState.OFF;
    if (this.airConditionerAPI.model.mode === Mode.cooling) {
      currentValue = this.api.hap.Characteristic.CurrentHeatingCoolingState.COOL;
    } else if (this.airConditionerAPI.model.mode === Mode.heating) {
      currentValue = this.api.hap.Characteristic.CurrentHeatingCoolingState.HEAT;
    } 

    callback(null, currentValue);
  }
  
  /**
   * Handle requests to get the current value of the "Target Heater Cooler State" characteristic
   */
  handleTargetHeaterCoolerStateGet(callback) {
    this.log.debug('Triggered GET TargetHeaterCoolerState');

    let currentValue = this.api.hap.Characteristic.TargetHeatingCoolingState.AUTO;
    if (this.airConditionerAPI.model.mode === Mode.cooling) {
      currentValue = this.api.hap.Characteristic.TargetHeatingCoolingState.COOL;
    } else if (this.airConditionerAPI.model.mode === Mode.heating) {
      currentValue = this.api.hap.Characteristic.TargetHeatingCoolingState.HEAT;
    } else if (this.airConditionerAPI.model.mode === Mode.auto) {
      currentValue = this.api.hap.Characteristic.TargetHeatingCoolingState.AUTO;
    }

    // set this to a valid value for TargetHeaterCoolerState

    callback(null, currentValue);
  }

  /**
   * Handle requests to set the "Target Heater Cooler State" characteristic
   */
  handleTargetHeaterCoolerStateSet(value, callback) {
    this.log.debug('Triggered SET TargetHeaterCoolerState:', value);

    if (value === this.api.hap.Characteristic.TargetHeatingCoolingState.AUTO) {
      this.airConditionerAPI.setPower(State.on);
      this.airConditionerAPI.setMode(Mode.auto);
    } else if (value === this.api.hap.Characteristic.TargetHeatingCoolingState.COOL) {
      this.airConditionerAPI.setPower(State.on);
      this.airConditionerAPI.setMode(Mode.cooling);
    } else if (value === this.api.hap.Characteristic.TargetHeatingCoolingState.HEAT) {
      this.airConditionerAPI.setPower(State.on);
      this.airConditionerAPI.setMode(Mode.heating);
    } else if (value === this.api.hap.Characteristic.TargetHeatingCoolingState.OFF) {
      this.airConditionerAPI.setPower(State.off);
    } 


    callback(null);
  }

  /**
   * Handle requests to get the current value of the "Current Temperature" characteristic
   */
  handleCurrentTemperatureGet(callback) {
    this.log.debug('Triggered GET CurrentTemperature');

    // set this to a valid value for CurrentTemperature
    const currentValue = this.airConditionerAPI.model.ambientTemp;

    callback(null, currentValue);
  }

  handleThresholdTemperatureSet(value, callback) {
    this.log.debug('Triggered SET ThresholdTemperature:', value);
    
    this.airConditionerAPI.setTemp(value);

    callback(null);
  }

  handleThresholdTemperatureGet(callback) {
    this.log.debug('Triggered GET ThresholdTemperature');

    // set this to a valid value for CurrentTemperature
    const currentValue = this.airConditionerAPI.model.temp;

    callback(null, currentValue);
  }

  /**
   * Handle requests to get the current value of the "Temperature Display Units" characteristic
   */
  handleTemperatureDisplayUnitsGet(callback) {
    this.log.debug('Triggered GET TemperatureDisplayUnits');

    // set this to a valid value for TemperatureDisplayUnits
    const currentValue = 0;

    callback(null, currentValue);
  }

  /**
   * Handle requests to set the "Temperature Display Units" characteristic
   */
  handleTemperatureDisplayUnitsSet(value, callback) {
    this.log.debug('Triggered SET TemperatureDisplayUnits:', value);

    callback(null);
  }
}