import {
  CapabilityCode,
  CompatibilityLevel,
  HubRelationType,
  InfrastructureRequirementCode,
  InstallationDifficulty,
  Prisma,
  PrismaClient,
  ProductType,
  RecommendedTier,
  StockStatus,
} from "@prisma/client";

const prisma = new PrismaClient();

type ProtocolLinkInput = {
  slug: string;
  isPrimary?: boolean;
  minVersion?: string;
  notes?: string;
};

type EcosystemCompatibilityInput = {
  slug: string;
  level: CompatibilityLevel;
  requiresBridge?: boolean;
  requiresCloudLink?: boolean;
  notes?: string;
};

type SupplierLinkInput = {
  supplierKey: string;
  supplierSku?: string;
  productUrl?: string;
  currency?: string;
  price?: number;
  stockStatus?: StockStatus;
  estimatedDeliveryDays?: number;
  isPreferredSupplier?: boolean;
};

type ProductSeedInput = {
  brandSlug: string;
  productType: ProductType;
  name: string;
  slug: string;
  sku?: string;
  modelCode?: string;
  description: string;
  requiresNeutral: boolean;
  localControl: boolean;
  cloudRequired: boolean;
  installationDifficulty: InstallationDifficulty;
  recommendedTier: RecommendedTier;
  powerConsumption?: number;
  activePowerUnit?: string;
  protocols: ProtocolLinkInput[];
  capabilities: CapabilityCode[];
  infrastructureRequirements: InfrastructureRequirementCode[];
  ecosystemCompatibilities: EcosystemCompatibilityInput[];
  hubRelations?: Array<{
    hubSlug: string;
    relationType: HubRelationType;
    notes?: string;
  }>;
  suppliers: SupplierLinkInput[];
};

const brands = [
  { name: "Aqara", slug: "aqara", website: "https://www.aqara.com" },
  { name: "Sonoff", slug: "sonoff", website: "https://sonoff.tech" },
  { name: "Shelly", slug: "shelly", website: "https://www.shelly.com" },
  { name: "TP-Link", slug: "tp-link", website: "https://www.tp-link.com" },
  { name: "Hikvision", slug: "hikvision", website: "https://www.hikvision.com" },
  { name: "Ubiquiti", slug: "ubiquiti", website: "https://www.ui.com" },
] as const;

const protocols = [
  {
    name: "Zigbee",
    slug: "zigbee",
    description: "Low-power mesh protocol for sensors and control devices.",
  },
  {
    name: "Matter",
    slug: "matter",
    description: "Interoperable smart-home application layer standard.",
  },
  {
    name: "WiFi",
    slug: "wifi",
    description: "IP-based wireless connectivity.",
  },
  {
    name: "Thread",
    slug: "thread",
    description: "Low-power IPv6 mesh transport used by Matter.",
  },
  {
    name: "Z-Wave",
    slug: "z-wave",
    description: "Sub-GHz mesh protocol for smart-home devices.",
  },
  {
    name: "Ethernet",
    slug: "ethernet",
    description: "Wired LAN transport for reliability and low latency.",
  },
] as const;

const ecosystems = [
  {
    name: "Home Assistant",
    slug: "home-assistant",
    vendor: "Nabu Casa",
    description: "Local-first automation platform.",
  },
  {
    name: "Amazon Alexa",
    slug: "alexa",
    vendor: "Amazon",
    description: "Voice assistant and ecosystem by Amazon.",
  },
  {
    name: "Google Home",
    slug: "google-home",
    vendor: "Google",
    description: "Google voice and smart-home ecosystem.",
  },
  {
    name: "Apple HomeKit",
    slug: "homekit",
    vendor: "Apple",
    description: "Apple smart-home ecosystem.",
  },
  {
    name: "Tuya Smart",
    slug: "tuya",
    vendor: "Tuya",
    description: "Cloud-centric smart-home ecosystem.",
  },
] as const;

const capabilities = [
  {
    code: CapabilityCode.ON_OFF,
    name: "On/Off",
    description: "Binary power or state control.",
  },
  {
    code: CapabilityCode.DIMMING,
    name: "Dimming",
    description: "Continuous brightness level control.",
  },
  {
    code: CapabilityCode.RGB,
    name: "RGB Lighting",
    description: "Color-capable lighting control.",
  },
  {
    code: CapabilityCode.MOTION,
    name: "Motion Detection",
    description: "Reports motion events.",
  },
  {
    code: CapabilityCode.TEMPERATURE,
    name: "Temperature Sensing",
    description: "Measures ambient temperature.",
  },
  {
    code: CapabilityCode.HUMIDITY,
    name: "Humidity Sensing",
    description: "Measures ambient humidity.",
  },
  {
    code: CapabilityCode.POWER_MONITORING,
    name: "Power Monitoring",
    description: "Real-time electrical power telemetry.",
  },
  {
    code: CapabilityCode.IR_CONTROL,
    name: "IR Control",
    description: "Infrared learning/transmit for appliances.",
  },
  {
    code: CapabilityCode.AUDIO,
    name: "Audio",
    description: "Audio stream or playback features.",
  },
  {
    code: CapabilityCode.VIDEO,
    name: "Video",
    description: "Live video streaming or recording.",
  },
  {
    code: CapabilityCode.PRESENCE,
    name: "Presence Detection",
    description: "Presence/occupancy oriented detection.",
  },
  {
    code: CapabilityCode.ENERGY_MONITORING,
    name: "Energy Monitoring",
    description: "Accumulated energy and consumption analytics.",
  },
] as const;

const infrastructureRequirements = [
  {
    code: InfrastructureRequirementCode.GOOD_WIFI,
    name: "Good WiFi Coverage",
    description: "Stable RSSI across installation points.",
  },
  {
    code: InfrastructureRequirementCode.MESH_WIFI,
    name: "Mesh WiFi Recommended",
    description: "Multi-AP mesh coverage for reliability.",
  },
  {
    code: InfrastructureRequirementCode.ETHERNET,
    name: "Ethernet Available",
    description: "Structured cabling available at device location.",
  },
  {
    code: InfrastructureRequirementCode.UPS_RECOMMENDED,
    name: "UPS Recommended",
    description: "Backup power advised for core nodes.",
  },
  {
    code: InfrastructureRequirementCode.VLAN_RECOMMENDED,
    name: "VLAN Recommended",
    description: "IoT network segmentation recommended.",
  },
  {
    code: InfrastructureRequirementCode.POE_REQUIRED,
    name: "PoE Required",
    description: "Power-over-Ethernet needed for operation.",
  },
] as const;

const suppliers = [
  {
    key: "amazon-us",
    id: "sup_amazon_us",
    name: "Amazon US",
    website: "https://www.amazon.com",
    country: "US",
    supportsLocalStock: false,
    notes: "Broad catalog and fast international shipping windows.",
  },
  {
    key: "mercadolibre-co",
    id: "sup_mercadolibre_co",
    name: "Mercado Libre Colombia",
    website: "https://www.mercadolibre.com.co",
    country: "CO",
    supportsLocalStock: true,
    notes: "Main local marketplace in Colombia with varied sellers.",
  },
  {
    key: "smarthouse-co",
    id: "sup_smarthouse_co",
    name: "SmartHouse Colombia",
    website: "https://smarthousecolombia.com",
    country: "CO",
    supportsLocalStock: true,
    notes: "Local smart-home specialist with retrofit-oriented catalog.",
  },
  {
    key: "intcomex-co",
    id: "sup_intcomex_co",
    name: "Intcomex Colombia",
    website: "https://www.intcomex.com",
    country: "CO",
    supportsLocalStock: true,
    notes: "Regional distributor with enterprise/network equipment lines.",
  },
  {
    key: "ubiquiti-store",
    id: "sup_ubiquiti_store",
    name: "Ubiquiti Store",
    website: "https://store.ui.com",
    country: "US",
    supportsLocalStock: false,
    notes: "Official vendor for UniFi hardware and accessories.",
  },
] as const;

const products: ProductSeedInput[] = [
  {
    brandSlug: "aqara",
    productType: ProductType.SWITCH,
    name: "Aqara Smart Wall Switch H1 (No Neutral)",
    slug: "aqara-h1-no-neutral",
    sku: "WS-EUK01",
    modelCode: "WS-EUK01",
    description: "Single-rocker Zigbee wall switch for retrofit installations without neutral wire.",
    requiresNeutral: false,
    localControl: true,
    cloudRequired: false,
    installationDifficulty: InstallationDifficulty.MEDIUM,
    recommendedTier: RecommendedTier.STANDARD,
    powerConsumption: 0.5,
    protocols: [{ slug: "zigbee", isPrimary: true, minVersion: "3.0" }],
    capabilities: [CapabilityCode.ON_OFF],
    infrastructureRequirements: [InfrastructureRequirementCode.GOOD_WIFI],
    ecosystemCompatibilities: [
      { slug: "home-assistant", level: CompatibilityLevel.CERTIFIED, requiresBridge: true, notes: "Works well via ZHA/Zigbee2MQTT." },
      { slug: "alexa", level: CompatibilityLevel.COMPATIBLE, requiresBridge: true, requiresCloudLink: true },
      { slug: "google-home", level: CompatibilityLevel.COMPATIBLE, requiresBridge: true, requiresCloudLink: true },
      { slug: "homekit", level: CompatibilityLevel.COMPATIBLE, requiresBridge: true },
      { slug: "tuya", level: CompatibilityLevel.NOT_SUPPORTED },
    ],
    hubRelations: [
      { hubSlug: "aqara-hub-m3", relationType: HubRelationType.OPTIONAL, notes: "Optional if using Home Assistant Zigbee coordinator." },
      { hubSlug: "sonoff-zbbridge-p", relationType: HubRelationType.OPTIONAL },
    ],
    suppliers: [
      {
        supplierKey: "mercadolibre-co",
        supplierSku: "WS-EUK01",
        productUrl: "https://listado.mercadolibre.com.co/aqara-h1-no-neutral",
        currency: "COP",
        price: 169000,
        stockStatus: StockStatus.IN_STOCK,
        estimatedDeliveryDays: 3,
        isPreferredSupplier: true,
      },
      {
        supplierKey: "amazon-us",
        supplierSku: "WS-EUK01",
        productUrl: "https://www.amazon.com/s?k=Aqara+H1+No+Neutral",
        currency: "USD",
        price: 39.99,
        stockStatus: StockStatus.IN_STOCK,
        estimatedDeliveryDays: 8,
      },
    ],
  },
  {
    brandSlug: "aqara",
    productType: ProductType.SWITCH,
    name: "Aqara Smart Wall Switch H1 (With Neutral)",
    slug: "aqara-h1-with-neutral",
    sku: "WS-EUK03",
    modelCode: "WS-EUK03",
    description: "Zigbee wall switch with neutral wire for higher electrical stability.",
    requiresNeutral: true,
    localControl: true,
    cloudRequired: false,
    installationDifficulty: InstallationDifficulty.MEDIUM,
    recommendedTier: RecommendedTier.STANDARD,
    powerConsumption: 0.8,
    protocols: [{ slug: "zigbee", isPrimary: true, minVersion: "3.0" }],
    capabilities: [CapabilityCode.ON_OFF],
    infrastructureRequirements: [InfrastructureRequirementCode.GOOD_WIFI],
    ecosystemCompatibilities: [
      { slug: "home-assistant", level: CompatibilityLevel.CERTIFIED, requiresBridge: true },
      { slug: "alexa", level: CompatibilityLevel.COMPATIBLE, requiresBridge: true, requiresCloudLink: true },
      { slug: "google-home", level: CompatibilityLevel.COMPATIBLE, requiresBridge: true, requiresCloudLink: true },
      { slug: "homekit", level: CompatibilityLevel.COMPATIBLE, requiresBridge: true },
      { slug: "tuya", level: CompatibilityLevel.NOT_SUPPORTED },
    ],
    hubRelations: [{ hubSlug: "aqara-hub-m3", relationType: HubRelationType.OPTIONAL }],
    suppliers: [
      {
        supplierKey: "smarthouse-co",
        supplierSku: "WS-EUK03",
        productUrl: "https://smarthousecolombia.com/search?q=Aqara+H1+neutral",
        currency: "COP",
        price: 199000,
        stockStatus: StockStatus.IN_STOCK,
        estimatedDeliveryDays: 2,
        isPreferredSupplier: true,
      },
      {
        supplierKey: "amazon-us",
        supplierSku: "WS-EUK03",
        productUrl: "https://www.amazon.com/s?k=Aqara+H1+With+Neutral",
        currency: "USD",
        price: 44.99,
        stockStatus: StockStatus.IN_STOCK,
        estimatedDeliveryDays: 8,
      },
    ],
  },
  {
    brandSlug: "aqara",
    productType: ProductType.SENSOR,
    name: "Aqara Motion Sensor P1",
    slug: "aqara-motion-sensor-p1",
    sku: "MS-S02",
    modelCode: "MS-S02",
    description: "Long-battery Zigbee motion sensor with configurable sensitivity and timeout.",
    requiresNeutral: false,
    localControl: true,
    cloudRequired: false,
    installationDifficulty: InstallationDifficulty.LOW,
    recommendedTier: RecommendedTier.ENTRY,
    protocols: [{ slug: "zigbee", isPrimary: true, minVersion: "3.0" }],
    capabilities: [CapabilityCode.MOTION, CapabilityCode.PRESENCE],
    infrastructureRequirements: [InfrastructureRequirementCode.GOOD_WIFI],
    ecosystemCompatibilities: [
      { slug: "home-assistant", level: CompatibilityLevel.CERTIFIED, requiresBridge: true },
      { slug: "alexa", level: CompatibilityLevel.COMPATIBLE, requiresBridge: true, requiresCloudLink: true },
      { slug: "google-home", level: CompatibilityLevel.LIMITED, requiresBridge: true, requiresCloudLink: true },
      { slug: "homekit", level: CompatibilityLevel.COMPATIBLE, requiresBridge: true },
      { slug: "tuya", level: CompatibilityLevel.NOT_SUPPORTED },
    ],
    hubRelations: [{ hubSlug: "aqara-hub-m3", relationType: HubRelationType.OPTIONAL }],
    suppliers: [
      {
        supplierKey: "mercadolibre-co",
        supplierSku: "MS-S02",
        productUrl: "https://listado.mercadolibre.com.co/aqara-motion-sensor-p1",
        currency: "COP",
        price: 129000,
        stockStatus: StockStatus.IN_STOCK,
        estimatedDeliveryDays: 3,
        isPreferredSupplier: true,
      },
      {
        supplierKey: "amazon-us",
        supplierSku: "MS-S02",
        productUrl: "https://www.amazon.com/s?k=Aqara+Motion+Sensor+P1",
        currency: "USD",
        price: 24.99,
        stockStatus: StockStatus.IN_STOCK,
        estimatedDeliveryDays: 8,
      },
    ],
  },
  {
    brandSlug: "aqara",
    productType: ProductType.SENSOR,
    name: "Aqara Door and Window Sensor P2",
    slug: "aqara-door-window-sensor-p2",
    sku: "DW-S03D",
    modelCode: "DW-S03D",
    description: "Matter-over-Thread contact sensor for low-latency local automations.",
    requiresNeutral: false,
    localControl: true,
    cloudRequired: false,
    installationDifficulty: InstallationDifficulty.LOW,
    recommendedTier: RecommendedTier.STANDARD,
    protocols: [
      { slug: "matter", isPrimary: true, minVersion: "1.2" },
      { slug: "thread", minVersion: "1.3" },
    ],
    capabilities: [CapabilityCode.ON_OFF, CapabilityCode.PRESENCE],
    infrastructureRequirements: [InfrastructureRequirementCode.GOOD_WIFI, InfrastructureRequirementCode.MESH_WIFI],
    ecosystemCompatibilities: [
      { slug: "home-assistant", level: CompatibilityLevel.COMPATIBLE, notes: "Via Thread border router and Matter integration." },
      { slug: "alexa", level: CompatibilityLevel.COMPATIBLE, requiresCloudLink: true },
      { slug: "google-home", level: CompatibilityLevel.COMPATIBLE, requiresCloudLink: true },
      { slug: "homekit", level: CompatibilityLevel.CERTIFIED },
      { slug: "tuya", level: CompatibilityLevel.NOT_SUPPORTED },
    ],
    suppliers: [
      {
        supplierKey: "amazon-us",
        supplierSku: "DW-S03D",
        productUrl: "https://www.amazon.com/s?k=Aqara+Door+and+Window+Sensor+P2",
        currency: "USD",
        price: 29.99,
        stockStatus: StockStatus.IN_STOCK,
        estimatedDeliveryDays: 9,
        isPreferredSupplier: true,
      },
      {
        supplierKey: "mercadolibre-co",
        supplierSku: "DW-S03D",
        productUrl: "https://listado.mercadolibre.com.co/aqara-p2-sensor",
        currency: "COP",
        price: 159000,
        stockStatus: StockStatus.LOW_STOCK,
        estimatedDeliveryDays: 4,
      },
    ],
  },
  {
    brandSlug: "aqara",
    productType: ProductType.HUB,
    name: "Aqara Hub M3",
    slug: "aqara-hub-m3-product",
    sku: "HM-G01D",
    modelCode: "HM-G01D",
    description: "Aqara flagship hub with Matter bridge and IR automation support.",
    requiresNeutral: false,
    localControl: true,
    cloudRequired: false,
    installationDifficulty: InstallationDifficulty.LOW,
    recommendedTier: RecommendedTier.PRO,
    powerConsumption: 6,
    protocols: [
      { slug: "zigbee", isPrimary: true, minVersion: "3.0" },
      { slug: "matter", minVersion: "1.2" },
      { slug: "wifi" },
      { slug: "ethernet" },
    ],
    capabilities: [CapabilityCode.IR_CONTROL, CapabilityCode.ON_OFF],
    infrastructureRequirements: [
      InfrastructureRequirementCode.GOOD_WIFI,
      InfrastructureRequirementCode.ETHERNET,
      InfrastructureRequirementCode.UPS_RECOMMENDED,
    ],
    ecosystemCompatibilities: [
      { slug: "home-assistant", level: CompatibilityLevel.COMPATIBLE, notes: "Works as bridge for selected Aqara devices." },
      { slug: "alexa", level: CompatibilityLevel.CERTIFIED, requiresCloudLink: true },
      { slug: "google-home", level: CompatibilityLevel.CERTIFIED, requiresCloudLink: true },
      { slug: "homekit", level: CompatibilityLevel.CERTIFIED },
      { slug: "tuya", level: CompatibilityLevel.NOT_SUPPORTED },
    ],
    suppliers: [
      {
        supplierKey: "amazon-us",
        supplierSku: "HM-G01D",
        productUrl: "https://www.amazon.com/s?k=Aqara+Hub+M3",
        currency: "USD",
        price: 129.99,
        stockStatus: StockStatus.IN_STOCK,
        estimatedDeliveryDays: 8,
        isPreferredSupplier: true,
      },
      {
        supplierKey: "smarthouse-co",
        supplierSku: "HM-G01D",
        productUrl: "https://smarthousecolombia.com/search?q=Aqara+Hub+M3",
        currency: "COP",
        price: 599000,
        stockStatus: StockStatus.LOW_STOCK,
        estimatedDeliveryDays: 3,
      },
    ],
  },
  {
    brandSlug: "sonoff",
    productType: ProductType.RELAY,
    name: "Sonoff ZBMINI-L2",
    slug: "sonoff-zbmini-l2",
    sku: "ZBMINI-L2",
    modelCode: "ZBMINI-L2",
    description: "Zigbee no-neutral retrofit relay for existing wall switches.",
    requiresNeutral: false,
    localControl: true,
    cloudRequired: false,
    installationDifficulty: InstallationDifficulty.MEDIUM,
    recommendedTier: RecommendedTier.ENTRY,
    powerConsumption: 0.3,
    protocols: [{ slug: "zigbee", isPrimary: true, minVersion: "3.0" }],
    capabilities: [CapabilityCode.ON_OFF],
    infrastructureRequirements: [InfrastructureRequirementCode.GOOD_WIFI],
    ecosystemCompatibilities: [
      { slug: "home-assistant", level: CompatibilityLevel.CERTIFIED, requiresBridge: true },
      { slug: "alexa", level: CompatibilityLevel.LIMITED, requiresBridge: true, requiresCloudLink: true },
      { slug: "google-home", level: CompatibilityLevel.LIMITED, requiresBridge: true, requiresCloudLink: true },
      { slug: "homekit", level: CompatibilityLevel.NOT_SUPPORTED },
      { slug: "tuya", level: CompatibilityLevel.NOT_SUPPORTED },
    ],
    hubRelations: [{ hubSlug: "sonoff-zbbridge-p", relationType: HubRelationType.OPTIONAL }],
    suppliers: [
      {
        supplierKey: "mercadolibre-co",
        supplierSku: "ZBMINI-L2",
        productUrl: "https://listado.mercadolibre.com.co/sonoff-zbmini-l2",
        currency: "COP",
        price: 89000,
        stockStatus: StockStatus.IN_STOCK,
        estimatedDeliveryDays: 2,
        isPreferredSupplier: true,
      },
      {
        supplierKey: "amazon-us",
        supplierSku: "ZBMINI-L2",
        productUrl: "https://www.amazon.com/s?k=Sonoff+ZBMINI-L2",
        currency: "USD",
        price: 17.99,
        stockStatus: StockStatus.IN_STOCK,
        estimatedDeliveryDays: 8,
      },
    ],
  },
  {
    brandSlug: "sonoff",
    productType: ProductType.RELAY,
    name: "Sonoff ZBMINI-R2",
    slug: "sonoff-zbmini-r2",
    sku: "ZBMINI-R2",
    modelCode: "ZBMINI-R2",
    description: "Compact Zigbee relay with neutral requirement for stable power delivery.",
    requiresNeutral: true,
    localControl: true,
    cloudRequired: false,
    installationDifficulty: InstallationDifficulty.MEDIUM,
    recommendedTier: RecommendedTier.ENTRY,
    powerConsumption: 0.5,
    protocols: [{ slug: "zigbee", isPrimary: true }],
    capabilities: [CapabilityCode.ON_OFF],
    infrastructureRequirements: [InfrastructureRequirementCode.GOOD_WIFI],
    ecosystemCompatibilities: [
      { slug: "home-assistant", level: CompatibilityLevel.CERTIFIED, requiresBridge: true },
      { slug: "alexa", level: CompatibilityLevel.LIMITED, requiresBridge: true, requiresCloudLink: true },
      { slug: "google-home", level: CompatibilityLevel.LIMITED, requiresBridge: true, requiresCloudLink: true },
      { slug: "homekit", level: CompatibilityLevel.NOT_SUPPORTED },
      { slug: "tuya", level: CompatibilityLevel.NOT_SUPPORTED },
    ],
    hubRelations: [{ hubSlug: "sonoff-zbbridge-p", relationType: HubRelationType.OPTIONAL }],
    suppliers: [
      {
        supplierKey: "mercadolibre-co",
        supplierSku: "ZBMINI-R2",
        productUrl: "https://listado.mercadolibre.com.co/sonoff-zbmini-r2",
        currency: "COP",
        price: 95000,
        stockStatus: StockStatus.IN_STOCK,
        estimatedDeliveryDays: 2,
        isPreferredSupplier: true,
      },
      {
        supplierKey: "amazon-us",
        supplierSku: "ZBMINI-R2",
        productUrl: "https://www.amazon.com/s?k=Sonoff+ZBMINI-R2",
        currency: "USD",
        price: 18.99,
        stockStatus: StockStatus.IN_STOCK,
        estimatedDeliveryDays: 8,
      },
    ],
  },
  {
    brandSlug: "sonoff",
    productType: ProductType.PANEL,
    name: "Sonoff NSPanel Pro",
    slug: "sonoff-nspanel-pro",
    sku: "NSPanel Pro",
    modelCode: "NSPanel Pro",
    description: "Android-based smart control panel with Zigbee gateway features.",
    requiresNeutral: true,
    localControl: true,
    cloudRequired: false,
    installationDifficulty: InstallationDifficulty.HIGH,
    recommendedTier: RecommendedTier.PRO,
    powerConsumption: 5,
    protocols: [{ slug: "wifi", isPrimary: true }, { slug: "zigbee" }],
    capabilities: [CapabilityCode.ON_OFF, CapabilityCode.AUDIO],
    infrastructureRequirements: [InfrastructureRequirementCode.GOOD_WIFI],
    ecosystemCompatibilities: [
      { slug: "home-assistant", level: CompatibilityLevel.COMPATIBLE, notes: "Works through local integrations and MQTT bridging." },
      { slug: "alexa", level: CompatibilityLevel.COMPATIBLE, requiresCloudLink: true },
      { slug: "google-home", level: CompatibilityLevel.COMPATIBLE, requiresCloudLink: true },
      { slug: "homekit", level: CompatibilityLevel.NOT_SUPPORTED },
      { slug: "tuya", level: CompatibilityLevel.NOT_SUPPORTED },
    ],
    suppliers: [
      {
        supplierKey: "amazon-us",
        supplierSku: "NSPanel Pro",
        productUrl: "https://www.amazon.com/s?k=Sonoff+NSPanel+Pro",
        currency: "USD",
        price: 119,
        stockStatus: StockStatus.IN_STOCK,
        estimatedDeliveryDays: 8,
      },
      {
        supplierKey: "mercadolibre-co",
        supplierSku: "NSPanel Pro",
        productUrl: "https://listado.mercadolibre.com.co/sonoff-nspanel-pro",
        currency: "COP",
        price: 499000,
        stockStatus: StockStatus.LOW_STOCK,
        estimatedDeliveryDays: 3,
        isPreferredSupplier: true,
      },
    ],
  },
  {
    brandSlug: "sonoff",
    productType: ProductType.SENSOR,
    name: "Sonoff SNZB-02D",
    slug: "sonoff-snzb-02d",
    sku: "SNZB-02D",
    modelCode: "SNZB-02D",
    description: "Zigbee LCD temperature and humidity sensor for climate automations.",
    requiresNeutral: false,
    localControl: true,
    cloudRequired: false,
    installationDifficulty: InstallationDifficulty.LOW,
    recommendedTier: RecommendedTier.ENTRY,
    protocols: [{ slug: "zigbee", isPrimary: true }],
    capabilities: [CapabilityCode.TEMPERATURE, CapabilityCode.HUMIDITY],
    infrastructureRequirements: [InfrastructureRequirementCode.GOOD_WIFI],
    ecosystemCompatibilities: [
      { slug: "home-assistant", level: CompatibilityLevel.CERTIFIED, requiresBridge: true },
      { slug: "alexa", level: CompatibilityLevel.LIMITED, requiresBridge: true, requiresCloudLink: true },
      { slug: "google-home", level: CompatibilityLevel.LIMITED, requiresBridge: true, requiresCloudLink: true },
      { slug: "homekit", level: CompatibilityLevel.NOT_SUPPORTED },
      { slug: "tuya", level: CompatibilityLevel.NOT_SUPPORTED },
    ],
    hubRelations: [{ hubSlug: "sonoff-zbbridge-p", relationType: HubRelationType.OPTIONAL }],
    suppliers: [
      {
        supplierKey: "mercadolibre-co",
        supplierSku: "SNZB-02D",
        productUrl: "https://listado.mercadolibre.com.co/sonoff-snzb-02d",
        currency: "COP",
        price: 79000,
        stockStatus: StockStatus.IN_STOCK,
        estimatedDeliveryDays: 2,
        isPreferredSupplier: true,
      },
      {
        supplierKey: "amazon-us",
        supplierSku: "SNZB-02D",
        productUrl: "https://www.amazon.com/s?k=Sonoff+SNZB-02D",
        currency: "USD",
        price: 19.99,
        stockStatus: StockStatus.IN_STOCK,
        estimatedDeliveryDays: 8,
      },
    ],
  },
  {
    brandSlug: "sonoff",
    productType: ProductType.HUB,
    name: "Sonoff ZBBridge-P",
    slug: "sonoff-zbbridge-p-product",
    sku: "ZBBridge-P",
    modelCode: "ZBBridge-P",
    description: "WiFi to Zigbee gateway with local flashing options for advanced users.",
    requiresNeutral: false,
    localControl: true,
    cloudRequired: false,
    installationDifficulty: InstallationDifficulty.MEDIUM,
    recommendedTier: RecommendedTier.STANDARD,
    powerConsumption: 2,
    protocols: [{ slug: "wifi", isPrimary: true }, { slug: "zigbee" }],
    capabilities: [CapabilityCode.ON_OFF],
    infrastructureRequirements: [InfrastructureRequirementCode.GOOD_WIFI, InfrastructureRequirementCode.UPS_RECOMMENDED],
    ecosystemCompatibilities: [
      { slug: "home-assistant", level: CompatibilityLevel.COMPATIBLE, notes: "Best with Tasmota-based local integration." },
      { slug: "alexa", level: CompatibilityLevel.COMPATIBLE, requiresCloudLink: true },
      { slug: "google-home", level: CompatibilityLevel.COMPATIBLE, requiresCloudLink: true },
      { slug: "homekit", level: CompatibilityLevel.NOT_SUPPORTED },
      { slug: "tuya", level: CompatibilityLevel.NOT_SUPPORTED },
    ],
    suppliers: [
      {
        supplierKey: "mercadolibre-co",
        supplierSku: "ZBBridge-P",
        productUrl: "https://listado.mercadolibre.com.co/sonoff-zbbridge-p",
        currency: "COP",
        price: 169000,
        stockStatus: StockStatus.IN_STOCK,
        estimatedDeliveryDays: 2,
        isPreferredSupplier: true,
      },
      {
        supplierKey: "amazon-us",
        supplierSku: "ZBBridge-P",
        productUrl: "https://www.amazon.com/s?k=Sonoff+ZBBridge-P",
        currency: "USD",
        price: 35.99,
        stockStatus: StockStatus.IN_STOCK,
        estimatedDeliveryDays: 8,
      },
    ],
  },
  {
    brandSlug: "shelly",
    productType: ProductType.RELAY,
    name: "Shelly 1PM Gen3",
    slug: "shelly-1pm-gen3",
    sku: "Shelly1PMG3",
    modelCode: "SNSW-001P16EU",
    description: "WiFi relay with power metering for retrofit light circuits.",
    requiresNeutral: true,
    localControl: true,
    cloudRequired: false,
    installationDifficulty: InstallationDifficulty.MEDIUM,
    recommendedTier: RecommendedTier.STANDARD,
    powerConsumption: 1.2,
    protocols: [{ slug: "wifi", isPrimary: true }],
    capabilities: [CapabilityCode.ON_OFF, CapabilityCode.POWER_MONITORING, CapabilityCode.ENERGY_MONITORING],
    infrastructureRequirements: [InfrastructureRequirementCode.GOOD_WIFI],
    ecosystemCompatibilities: [
      { slug: "home-assistant", level: CompatibilityLevel.CERTIFIED, notes: "Native local API and MQTT." },
      { slug: "alexa", level: CompatibilityLevel.COMPATIBLE, requiresCloudLink: true },
      { slug: "google-home", level: CompatibilityLevel.COMPATIBLE, requiresCloudLink: true },
      { slug: "homekit", level: CompatibilityLevel.LIMITED, notes: "Via Home Assistant bridge." },
      { slug: "tuya", level: CompatibilityLevel.NOT_SUPPORTED },
    ],
    suppliers: [
      {
        supplierKey: "amazon-us",
        supplierSku: "Shelly1PMG3",
        productUrl: "https://www.amazon.com/s?k=Shelly+1PM+Gen3",
        currency: "USD",
        price: 24.99,
        stockStatus: StockStatus.IN_STOCK,
        estimatedDeliveryDays: 8,
      },
      {
        supplierKey: "mercadolibre-co",
        supplierSku: "Shelly1PMG3",
        productUrl: "https://listado.mercadolibre.com.co/shelly-1pm-gen3",
        currency: "COP",
        price: 135000,
        stockStatus: StockStatus.IN_STOCK,
        estimatedDeliveryDays: 3,
        isPreferredSupplier: true,
      },
    ],
  },
  {
    brandSlug: "shelly",
    productType: ProductType.DIMMER,
    name: "Shelly Dimmer 2",
    slug: "shelly-dimmer-2",
    sku: "SHDM-2",
    modelCode: "SHDM-2",
    description: "WiFi dimmer module for retrofit lighting with or without neutral.",
    requiresNeutral: false,
    localControl: true,
    cloudRequired: false,
    installationDifficulty: InstallationDifficulty.HIGH,
    recommendedTier: RecommendedTier.PRO,
    powerConsumption: 1.1,
    protocols: [{ slug: "wifi", isPrimary: true }],
    capabilities: [CapabilityCode.ON_OFF, CapabilityCode.DIMMING, CapabilityCode.POWER_MONITORING],
    infrastructureRequirements: [InfrastructureRequirementCode.GOOD_WIFI],
    ecosystemCompatibilities: [
      { slug: "home-assistant", level: CompatibilityLevel.CERTIFIED },
      { slug: "alexa", level: CompatibilityLevel.COMPATIBLE, requiresCloudLink: true },
      { slug: "google-home", level: CompatibilityLevel.COMPATIBLE, requiresCloudLink: true },
      { slug: "homekit", level: CompatibilityLevel.LIMITED, notes: "Best through Home Assistant." },
      { slug: "tuya", level: CompatibilityLevel.NOT_SUPPORTED },
    ],
    suppliers: [
      {
        supplierKey: "amazon-us",
        supplierSku: "SHDM-2",
        productUrl: "https://www.amazon.com/s?k=Shelly+Dimmer+2",
        currency: "USD",
        price: 29.99,
        stockStatus: StockStatus.IN_STOCK,
        estimatedDeliveryDays: 8,
      },
      {
        supplierKey: "mercadolibre-co",
        supplierSku: "SHDM-2",
        productUrl: "https://listado.mercadolibre.com.co/shelly-dimmer-2",
        currency: "COP",
        price: 149000,
        stockStatus: StockStatus.IN_STOCK,
        estimatedDeliveryDays: 3,
        isPreferredSupplier: true,
      },
    ],
  },
  {
    brandSlug: "shelly",
    productType: ProductType.SWITCH,
    name: "Shelly Plus i4",
    slug: "shelly-plus-i4",
    sku: "S3SW-001X16EU",
    modelCode: "S3SW-001X16EU",
    description: "WiFi multi-input switch controller for scene triggers and virtual controls.",
    requiresNeutral: true,
    localControl: true,
    cloudRequired: false,
    installationDifficulty: InstallationDifficulty.MEDIUM,
    recommendedTier: RecommendedTier.STANDARD,
    powerConsumption: 1,
    protocols: [{ slug: "wifi", isPrimary: true }],
    capabilities: [CapabilityCode.ON_OFF],
    infrastructureRequirements: [InfrastructureRequirementCode.GOOD_WIFI],
    ecosystemCompatibilities: [
      { slug: "home-assistant", level: CompatibilityLevel.CERTIFIED },
      { slug: "alexa", level: CompatibilityLevel.LIMITED, requiresCloudLink: true },
      { slug: "google-home", level: CompatibilityLevel.LIMITED, requiresCloudLink: true },
      { slug: "homekit", level: CompatibilityLevel.LIMITED },
      { slug: "tuya", level: CompatibilityLevel.NOT_SUPPORTED },
    ],
    suppliers: [
      {
        supplierKey: "amazon-us",
        supplierSku: "S3SW-001X16EU",
        productUrl: "https://www.amazon.com/s?k=Shelly+Plus+i4",
        currency: "USD",
        price: 17.99,
        stockStatus: StockStatus.IN_STOCK,
        estimatedDeliveryDays: 8,
      },
      {
        supplierKey: "smarthouse-co",
        supplierSku: "S3SW-001X16EU",
        productUrl: "https://smarthousecolombia.com/search?q=Shelly+Plus+i4",
        currency: "COP",
        price: 99000,
        stockStatus: StockStatus.IN_STOCK,
        estimatedDeliveryDays: 2,
        isPreferredSupplier: true,
      },
    ],
  },
  {
    brandSlug: "shelly",
    productType: ProductType.SENSOR,
    name: "Shelly H&T Gen3",
    slug: "shelly-ht-gen3",
    sku: "ShellyHTG3",
    modelCode: "ShellyHTG3",
    description: "WiFi temperature and humidity sensor with long battery life and local API.",
    requiresNeutral: false,
    localControl: true,
    cloudRequired: false,
    installationDifficulty: InstallationDifficulty.LOW,
    recommendedTier: RecommendedTier.STANDARD,
    protocols: [{ slug: "wifi", isPrimary: true }],
    capabilities: [CapabilityCode.TEMPERATURE, CapabilityCode.HUMIDITY],
    infrastructureRequirements: [InfrastructureRequirementCode.GOOD_WIFI],
    ecosystemCompatibilities: [
      { slug: "home-assistant", level: CompatibilityLevel.CERTIFIED },
      { slug: "alexa", level: CompatibilityLevel.LIMITED, requiresCloudLink: true },
      { slug: "google-home", level: CompatibilityLevel.LIMITED, requiresCloudLink: true },
      { slug: "homekit", level: CompatibilityLevel.LIMITED },
      { slug: "tuya", level: CompatibilityLevel.NOT_SUPPORTED },
    ],
    suppliers: [
      {
        supplierKey: "amazon-us",
        supplierSku: "ShellyHTG3",
        productUrl: "https://www.amazon.com/s?k=Shelly+H%26T+Gen3",
        currency: "USD",
        price: 24.99,
        stockStatus: StockStatus.IN_STOCK,
        estimatedDeliveryDays: 9,
      },
      {
        supplierKey: "mercadolibre-co",
        supplierSku: "ShellyHTG3",
        productUrl: "https://listado.mercadolibre.com.co/shelly-ht-gen3",
        currency: "COP",
        price: 125000,
        stockStatus: StockStatus.LOW_STOCK,
        estimatedDeliveryDays: 3,
        isPreferredSupplier: true,
      },
    ],
  },
  {
    brandSlug: "shelly",
    productType: ProductType.RELAY,
    name: "Shelly Pro 4PM",
    slug: "shelly-pro-4pm",
    sku: "SPEM-004PE16EU",
    modelCode: "SPEM-004PE16EU",
    description: "DIN-mount 4-channel relay with Ethernet and advanced metering.",
    requiresNeutral: true,
    localControl: true,
    cloudRequired: false,
    installationDifficulty: InstallationDifficulty.EXPERT,
    recommendedTier: RecommendedTier.ENTERPRISE,
    powerConsumption: 3.5,
    protocols: [{ slug: "ethernet", isPrimary: true }, { slug: "wifi" }],
    capabilities: [CapabilityCode.ON_OFF, CapabilityCode.POWER_MONITORING, CapabilityCode.ENERGY_MONITORING],
    infrastructureRequirements: [
      InfrastructureRequirementCode.ETHERNET,
      InfrastructureRequirementCode.UPS_RECOMMENDED,
      InfrastructureRequirementCode.VLAN_RECOMMENDED,
    ],
    ecosystemCompatibilities: [
      { slug: "home-assistant", level: CompatibilityLevel.CERTIFIED },
      { slug: "alexa", level: CompatibilityLevel.LIMITED, requiresCloudLink: true },
      { slug: "google-home", level: CompatibilityLevel.LIMITED, requiresCloudLink: true },
      { slug: "homekit", level: CompatibilityLevel.LIMITED },
      { slug: "tuya", level: CompatibilityLevel.NOT_SUPPORTED },
    ],
    suppliers: [
      {
        supplierKey: "amazon-us",
        supplierSku: "SPEM-004PE16EU",
        productUrl: "https://www.amazon.com/s?k=Shelly+Pro+4PM",
        currency: "USD",
        price: 129,
        stockStatus: StockStatus.IN_STOCK,
        estimatedDeliveryDays: 10,
      },
      {
        supplierKey: "intcomex-co",
        supplierSku: "SPEM-004PE16EU",
        productUrl: "https://www.intcomex.com/search?query=Shelly%20Pro%204PM",
        currency: "USD",
        price: 118,
        stockStatus: StockStatus.LOW_STOCK,
        estimatedDeliveryDays: 6,
        isPreferredSupplier: true,
      },
    ],
  },
  {
    brandSlug: "tp-link",
    productType: ProductType.RELAY,
    name: "TP-Link Tapo P110M",
    slug: "tp-link-tapo-p110m",
    sku: "Tapo P110M",
    modelCode: "Tapo P110M",
    description: "Matter-enabled smart plug with local energy monitoring.",
    requiresNeutral: false,
    localControl: true,
    cloudRequired: false,
    installationDifficulty: InstallationDifficulty.LOW,
    recommendedTier: RecommendedTier.STANDARD,
    powerConsumption: 0.8,
    protocols: [{ slug: "matter", isPrimary: true, minVersion: "1.2" }, { slug: "wifi" }],
    capabilities: [CapabilityCode.ON_OFF, CapabilityCode.POWER_MONITORING, CapabilityCode.ENERGY_MONITORING],
    infrastructureRequirements: [InfrastructureRequirementCode.GOOD_WIFI],
    ecosystemCompatibilities: [
      { slug: "home-assistant", level: CompatibilityLevel.COMPATIBLE, notes: "Matter integration with local control." },
      { slug: "alexa", level: CompatibilityLevel.CERTIFIED },
      { slug: "google-home", level: CompatibilityLevel.CERTIFIED },
      { slug: "homekit", level: CompatibilityLevel.CERTIFIED },
      { slug: "tuya", level: CompatibilityLevel.NOT_SUPPORTED },
    ],
    suppliers: [
      {
        supplierKey: "mercadolibre-co",
        supplierSku: "Tapo P110M",
        productUrl: "https://listado.mercadolibre.com.co/tapo-p110m",
        currency: "COP",
        price: 99000,
        stockStatus: StockStatus.IN_STOCK,
        estimatedDeliveryDays: 2,
        isPreferredSupplier: true,
      },
      {
        supplierKey: "amazon-us",
        supplierSku: "Tapo P110M",
        productUrl: "https://www.amazon.com/s?k=Tapo+P110M",
        currency: "USD",
        price: 24.99,
        stockStatus: StockStatus.IN_STOCK,
        estimatedDeliveryDays: 8,
      },
    ],
  },
  {
    brandSlug: "tp-link",
    productType: ProductType.CAMERA,
    name: "TP-Link Tapo C225",
    slug: "tp-link-tapo-c225",
    sku: "Tapo C225",
    modelCode: "Tapo C225",
    description: "2K pan/tilt WiFi camera with local storage and ONVIF options.",
    requiresNeutral: false,
    localControl: true,
    cloudRequired: false,
    installationDifficulty: InstallationDifficulty.LOW,
    recommendedTier: RecommendedTier.STANDARD,
    powerConsumption: 5,
    protocols: [{ slug: "wifi", isPrimary: true }],
    capabilities: [CapabilityCode.VIDEO, CapabilityCode.AUDIO, CapabilityCode.MOTION],
    infrastructureRequirements: [InfrastructureRequirementCode.GOOD_WIFI],
    ecosystemCompatibilities: [
      { slug: "home-assistant", level: CompatibilityLevel.COMPATIBLE, notes: "RTSP/ONVIF local integration." },
      { slug: "alexa", level: CompatibilityLevel.CERTIFIED, requiresCloudLink: true },
      { slug: "google-home", level: CompatibilityLevel.CERTIFIED, requiresCloudLink: true },
      { slug: "homekit", level: CompatibilityLevel.LIMITED },
      { slug: "tuya", level: CompatibilityLevel.NOT_SUPPORTED },
    ],
    suppliers: [
      {
        supplierKey: "mercadolibre-co",
        supplierSku: "Tapo C225",
        productUrl: "https://listado.mercadolibre.com.co/tapo-c225",
        currency: "COP",
        price: 239000,
        stockStatus: StockStatus.IN_STOCK,
        estimatedDeliveryDays: 2,
        isPreferredSupplier: true,
      },
      {
        supplierKey: "amazon-us",
        supplierSku: "Tapo C225",
        productUrl: "https://www.amazon.com/s?k=Tapo+C225",
        currency: "USD",
        price: 54.99,
        stockStatus: StockStatus.IN_STOCK,
        estimatedDeliveryDays: 8,
      },
    ],
  },
  {
    brandSlug: "tp-link",
    productType: ProductType.ROUTER,
    name: "TP-Link Deco X55 (3-pack)",
    slug: "tp-link-deco-x55-3pack",
    sku: "Deco X55(3-pack)",
    modelCode: "Deco X55",
    description: "WiFi 6 mesh system suitable for dense smart-home deployments.",
    requiresNeutral: false,
    localControl: true,
    cloudRequired: false,
    installationDifficulty: InstallationDifficulty.MEDIUM,
    recommendedTier: RecommendedTier.PRO,
    powerConsumption: 12,
    protocols: [{ slug: "wifi", isPrimary: true }, { slug: "ethernet" }],
    capabilities: [CapabilityCode.ON_OFF],
    infrastructureRequirements: [
      InfrastructureRequirementCode.MESH_WIFI,
      InfrastructureRequirementCode.ETHERNET,
      InfrastructureRequirementCode.UPS_RECOMMENDED,
    ],
    ecosystemCompatibilities: [
      { slug: "home-assistant", level: CompatibilityLevel.COMPATIBLE, notes: "Used as infra backbone for local-first devices." },
      { slug: "alexa", level: CompatibilityLevel.NOT_SUPPORTED },
      { slug: "google-home", level: CompatibilityLevel.NOT_SUPPORTED },
      { slug: "homekit", level: CompatibilityLevel.NOT_SUPPORTED },
      { slug: "tuya", level: CompatibilityLevel.NOT_SUPPORTED },
    ],
    suppliers: [
      {
        supplierKey: "mercadolibre-co",
        supplierSku: "Deco X55",
        productUrl: "https://listado.mercadolibre.com.co/deco-x55",
        currency: "COP",
        price: 1399000,
        stockStatus: StockStatus.IN_STOCK,
        estimatedDeliveryDays: 2,
        isPreferredSupplier: true,
      },
      {
        supplierKey: "amazon-us",
        supplierSku: "Deco X55",
        productUrl: "https://www.amazon.com/s?k=TP-Link+Deco+X55",
        currency: "USD",
        price: 249.99,
        stockStatus: StockStatus.IN_STOCK,
        estimatedDeliveryDays: 9,
      },
    ],
  },
  {
    brandSlug: "tp-link",
    productType: ProductType.SWITCH,
    name: "TP-Link Tapo S505D",
    slug: "tp-link-tapo-s505d",
    sku: "Tapo S505D",
    modelCode: "Tapo S505D",
    description: "Matter dimmer switch for North-American style circuits.",
    requiresNeutral: true,
    localControl: true,
    cloudRequired: false,
    installationDifficulty: InstallationDifficulty.MEDIUM,
    recommendedTier: RecommendedTier.STANDARD,
    powerConsumption: 0.7,
    protocols: [{ slug: "matter", isPrimary: true }, { slug: "wifi" }],
    capabilities: [CapabilityCode.ON_OFF, CapabilityCode.DIMMING],
    infrastructureRequirements: [InfrastructureRequirementCode.GOOD_WIFI],
    ecosystemCompatibilities: [
      { slug: "home-assistant", level: CompatibilityLevel.COMPATIBLE },
      { slug: "alexa", level: CompatibilityLevel.CERTIFIED },
      { slug: "google-home", level: CompatibilityLevel.CERTIFIED },
      { slug: "homekit", level: CompatibilityLevel.CERTIFIED },
      { slug: "tuya", level: CompatibilityLevel.NOT_SUPPORTED },
    ],
    suppliers: [
      {
        supplierKey: "amazon-us",
        supplierSku: "Tapo S505D",
        productUrl: "https://www.amazon.com/s?k=Tapo+S505D",
        currency: "USD",
        price: 29.99,
        stockStatus: StockStatus.IN_STOCK,
        estimatedDeliveryDays: 8,
        isPreferredSupplier: true,
      },
      {
        supplierKey: "mercadolibre-co",
        supplierSku: "Tapo S505D",
        productUrl: "https://listado.mercadolibre.com.co/tapo-s505d",
        currency: "COP",
        price: 159000,
        stockStatus: StockStatus.BACKORDER,
        estimatedDeliveryDays: 10,
      },
    ],
  },
  {
    brandSlug: "hikvision",
    productType: ProductType.CAMERA,
    name: "Hikvision DS-2CD2143G2-I",
    slug: "hikvision-ds-2cd2143g2-i",
    sku: "DS-2CD2143G2-I",
    modelCode: "DS-2CD2143G2-I",
    description: "4MP turret IP camera with AcuSense and PoE support.",
    requiresNeutral: false,
    localControl: true,
    cloudRequired: false,
    installationDifficulty: InstallationDifficulty.HIGH,
    recommendedTier: RecommendedTier.PRO,
    powerConsumption: 7,
    protocols: [{ slug: "ethernet", isPrimary: true }],
    capabilities: [CapabilityCode.VIDEO, CapabilityCode.MOTION],
    infrastructureRequirements: [
      InfrastructureRequirementCode.ETHERNET,
      InfrastructureRequirementCode.POE_REQUIRED,
      InfrastructureRequirementCode.VLAN_RECOMMENDED,
    ],
    ecosystemCompatibilities: [
      { slug: "home-assistant", level: CompatibilityLevel.CERTIFIED, notes: "Stable ONVIF/RTSP integration." },
      { slug: "alexa", level: CompatibilityLevel.LIMITED },
      { slug: "google-home", level: CompatibilityLevel.LIMITED },
      { slug: "homekit", level: CompatibilityLevel.NOT_SUPPORTED },
      { slug: "tuya", level: CompatibilityLevel.NOT_SUPPORTED },
    ],
    suppliers: [
      {
        supplierKey: "mercadolibre-co",
        supplierSku: "DS-2CD2143G2-I",
        productUrl: "https://listado.mercadolibre.com.co/ds-2cd2143g2-i",
        currency: "COP",
        price: 579000,
        stockStatus: StockStatus.IN_STOCK,
        estimatedDeliveryDays: 2,
        isPreferredSupplier: true,
      },
      {
        supplierKey: "intcomex-co",
        supplierSku: "DS-2CD2143G2-I",
        productUrl: "https://www.intcomex.com/search?query=DS-2CD2143G2-I",
        currency: "USD",
        price: 134,
        stockStatus: StockStatus.LOW_STOCK,
        estimatedDeliveryDays: 5,
      },
    ],
  },
  {
    brandSlug: "hikvision",
    productType: ProductType.PANEL,
    name: "Hikvision AX PRO DS-PWA96-M-WE",
    slug: "hikvision-ax-pro-ds-pwa96-m-we",
    sku: "DS-PWA96-M-WE",
    modelCode: "DS-PWA96-M-WE",
    description: "Wireless security alarm panel usable as perimeter automation anchor.",
    requiresNeutral: false,
    localControl: true,
    cloudRequired: false,
    installationDifficulty: InstallationDifficulty.HIGH,
    recommendedTier: RecommendedTier.PRO,
    powerConsumption: 10,
    protocols: [{ slug: "ethernet", isPrimary: true }, { slug: "wifi" }],
    capabilities: [CapabilityCode.ON_OFF, CapabilityCode.PRESENCE],
    infrastructureRequirements: [
      InfrastructureRequirementCode.ETHERNET,
      InfrastructureRequirementCode.UPS_RECOMMENDED,
      InfrastructureRequirementCode.VLAN_RECOMMENDED,
    ],
    ecosystemCompatibilities: [
      { slug: "home-assistant", level: CompatibilityLevel.COMPATIBLE, notes: "Integration available via community and API approaches." },
      { slug: "alexa", level: CompatibilityLevel.NOT_SUPPORTED },
      { slug: "google-home", level: CompatibilityLevel.NOT_SUPPORTED },
      { slug: "homekit", level: CompatibilityLevel.NOT_SUPPORTED },
      { slug: "tuya", level: CompatibilityLevel.NOT_SUPPORTED },
    ],
    suppliers: [
      {
        supplierKey: "intcomex-co",
        supplierSku: "DS-PWA96-M-WE",
        productUrl: "https://www.intcomex.com/search?query=DS-PWA96-M-WE",
        currency: "USD",
        price: 329,
        stockStatus: StockStatus.LOW_STOCK,
        estimatedDeliveryDays: 6,
        isPreferredSupplier: true,
      },
      {
        supplierKey: "mercadolibre-co",
        supplierSku: "DS-PWA96-M-WE",
        productUrl: "https://listado.mercadolibre.com.co/ds-pwa96-m-we",
        currency: "COP",
        price: 1599000,
        stockStatus: StockStatus.BACKORDER,
        estimatedDeliveryDays: 12,
      },
    ],
  },
  {
    brandSlug: "hikvision",
    productType: ProductType.PANEL,
    name: "Hikvision DS-KH6320-WTE1",
    slug: "hikvision-ds-kh6320-wte1",
    sku: "DS-KH6320-WTE1",
    modelCode: "DS-KH6320-WTE1",
    description: "Indoor IP video intercom panel with SIP and local network integration.",
    requiresNeutral: true,
    localControl: true,
    cloudRequired: false,
    installationDifficulty: InstallationDifficulty.HIGH,
    recommendedTier: RecommendedTier.PRO,
    powerConsumption: 8,
    protocols: [{ slug: "ethernet", isPrimary: true }, { slug: "wifi" }],
    capabilities: [CapabilityCode.VIDEO, CapabilityCode.AUDIO],
    infrastructureRequirements: [
      InfrastructureRequirementCode.ETHERNET,
      InfrastructureRequirementCode.VLAN_RECOMMENDED,
      InfrastructureRequirementCode.UPS_RECOMMENDED,
    ],
    ecosystemCompatibilities: [
      { slug: "home-assistant", level: CompatibilityLevel.COMPATIBLE, notes: "Works through SIP/RTSP and custom integrations." },
      { slug: "alexa", level: CompatibilityLevel.NOT_SUPPORTED },
      { slug: "google-home", level: CompatibilityLevel.NOT_SUPPORTED },
      { slug: "homekit", level: CompatibilityLevel.NOT_SUPPORTED },
      { slug: "tuya", level: CompatibilityLevel.NOT_SUPPORTED },
    ],
    suppliers: [
      {
        supplierKey: "mercadolibre-co",
        supplierSku: "DS-KH6320-WTE1",
        productUrl: "https://listado.mercadolibre.com.co/ds-kh6320-wte1",
        currency: "COP",
        price: 1120000,
        stockStatus: StockStatus.LOW_STOCK,
        estimatedDeliveryDays: 4,
        isPreferredSupplier: true,
      },
      {
        supplierKey: "intcomex-co",
        supplierSku: "DS-KH6320-WTE1",
        productUrl: "https://www.intcomex.com/search?query=DS-KH6320-WTE1",
        currency: "USD",
        price: 239,
        stockStatus: StockStatus.LOW_STOCK,
        estimatedDeliveryDays: 6,
      },
    ],
  },
  {
    brandSlug: "ubiquiti",
    productType: ProductType.ROUTER,
    name: "Ubiquiti UniFi Dream Machine SE",
    slug: "ubiquiti-udm-se",
    sku: "UDM-SE",
    modelCode: "UDM-SE",
    description: "Enterprise gateway with controller, PoE ports and strong VLAN segmentation.",
    requiresNeutral: false,
    localControl: true,
    cloudRequired: false,
    installationDifficulty: InstallationDifficulty.EXPERT,
    recommendedTier: RecommendedTier.ENTERPRISE,
    powerConsumption: 50,
    protocols: [{ slug: "ethernet", isPrimary: true }],
    capabilities: [CapabilityCode.ON_OFF],
    infrastructureRequirements: [
      InfrastructureRequirementCode.ETHERNET,
      InfrastructureRequirementCode.UPS_RECOMMENDED,
      InfrastructureRequirementCode.VLAN_RECOMMENDED,
    ],
    ecosystemCompatibilities: [
      { slug: "home-assistant", level: CompatibilityLevel.COMPATIBLE, notes: "Network telemetry and presence integrations available." },
      { slug: "alexa", level: CompatibilityLevel.NOT_SUPPORTED },
      { slug: "google-home", level: CompatibilityLevel.NOT_SUPPORTED },
      { slug: "homekit", level: CompatibilityLevel.NOT_SUPPORTED },
      { slug: "tuya", level: CompatibilityLevel.NOT_SUPPORTED },
    ],
    suppliers: [
      {
        supplierKey: "ubiquiti-store",
        supplierSku: "UDM-SE",
        productUrl: "https://store.ui.com/us/en/products/udm-se",
        currency: "USD",
        price: 499,
        stockStatus: StockStatus.IN_STOCK,
        estimatedDeliveryDays: 9,
        isPreferredSupplier: true,
      },
      {
        supplierKey: "intcomex-co",
        supplierSku: "UDM-SE",
        productUrl: "https://www.intcomex.com/search?query=UDM-SE",
        currency: "USD",
        price: 529,
        stockStatus: StockStatus.LOW_STOCK,
        estimatedDeliveryDays: 7,
      },
    ],
  },
  {
    brandSlug: "ubiquiti",
    productType: ProductType.ROUTER,
    name: "Ubiquiti UniFi 6 Lite",
    slug: "ubiquiti-unifi-6-lite",
    sku: "U6-Lite",
    modelCode: "U6-Lite",
    description: "Compact WiFi 6 access point for dense IoT coverage.",
    requiresNeutral: false,
    localControl: true,
    cloudRequired: false,
    installationDifficulty: InstallationDifficulty.MEDIUM,
    recommendedTier: RecommendedTier.PRO,
    powerConsumption: 12,
    protocols: [{ slug: "wifi", isPrimary: true }, { slug: "ethernet" }],
    capabilities: [CapabilityCode.ON_OFF],
    infrastructureRequirements: [
      InfrastructureRequirementCode.MESH_WIFI,
      InfrastructureRequirementCode.ETHERNET,
      InfrastructureRequirementCode.POE_REQUIRED,
      InfrastructureRequirementCode.VLAN_RECOMMENDED,
    ],
    ecosystemCompatibilities: [
      { slug: "home-assistant", level: CompatibilityLevel.COMPATIBLE },
      { slug: "alexa", level: CompatibilityLevel.NOT_SUPPORTED },
      { slug: "google-home", level: CompatibilityLevel.NOT_SUPPORTED },
      { slug: "homekit", level: CompatibilityLevel.NOT_SUPPORTED },
      { slug: "tuya", level: CompatibilityLevel.NOT_SUPPORTED },
    ],
    suppliers: [
      {
        supplierKey: "ubiquiti-store",
        supplierSku: "U6-Lite",
        productUrl: "https://store.ui.com/us/en/products/u6-lite",
        currency: "USD",
        price: 99,
        stockStatus: StockStatus.IN_STOCK,
        estimatedDeliveryDays: 9,
        isPreferredSupplier: true,
      },
      {
        supplierKey: "intcomex-co",
        supplierSku: "U6-Lite",
        productUrl: "https://www.intcomex.com/search?query=U6-Lite",
        currency: "USD",
        price: 109,
        stockStatus: StockStatus.LOW_STOCK,
        estimatedDeliveryDays: 7,
      },
    ],
  },
  {
    brandSlug: "ubiquiti",
    productType: ProductType.ROUTER,
    name: "Ubiquiti UniFi Switch Lite 8 PoE",
    slug: "ubiquiti-usw-lite-8-poe",
    sku: "USW-Lite-8-PoE",
    modelCode: "USW-Lite-8-PoE",
    description: "Managed PoE switch suitable for cameras and access points.",
    requiresNeutral: false,
    localControl: true,
    cloudRequired: false,
    installationDifficulty: InstallationDifficulty.MEDIUM,
    recommendedTier: RecommendedTier.PRO,
    powerConsumption: 60,
    protocols: [{ slug: "ethernet", isPrimary: true }],
    capabilities: [CapabilityCode.ON_OFF, CapabilityCode.POWER_MONITORING],
    infrastructureRequirements: [
      InfrastructureRequirementCode.ETHERNET,
      InfrastructureRequirementCode.UPS_RECOMMENDED,
      InfrastructureRequirementCode.VLAN_RECOMMENDED,
    ],
    ecosystemCompatibilities: [
      { slug: "home-assistant", level: CompatibilityLevel.COMPATIBLE },
      { slug: "alexa", level: CompatibilityLevel.NOT_SUPPORTED },
      { slug: "google-home", level: CompatibilityLevel.NOT_SUPPORTED },
      { slug: "homekit", level: CompatibilityLevel.NOT_SUPPORTED },
      { slug: "tuya", level: CompatibilityLevel.NOT_SUPPORTED },
    ],
    suppliers: [
      {
        supplierKey: "ubiquiti-store",
        supplierSku: "USW-Lite-8-PoE",
        productUrl: "https://store.ui.com/us/en/products/usw-lite-8-poe",
        currency: "USD",
        price: 109,
        stockStatus: StockStatus.IN_STOCK,
        estimatedDeliveryDays: 9,
        isPreferredSupplier: true,
      },
      {
        supplierKey: "intcomex-co",
        supplierSku: "USW-Lite-8-PoE",
        productUrl: "https://www.intcomex.com/search?query=USW-Lite-8-PoE",
        currency: "USD",
        price: 119,
        stockStatus: StockStatus.LOW_STOCK,
        estimatedDeliveryDays: 7,
      },
    ],
  },
  {
    brandSlug: "ubiquiti",
    productType: ProductType.UPS,
    name: "Ubiquiti UniFi SmartPower USP-RPS",
    slug: "ubiquiti-usp-rps",
    sku: "USP-RPS",
    modelCode: "USP-RPS",
    description: "Redundant power system for critical UniFi rack equipment.",
    requiresNeutral: false,
    localControl: true,
    cloudRequired: false,
    installationDifficulty: InstallationDifficulty.HIGH,
    recommendedTier: RecommendedTier.ENTERPRISE,
    powerConsumption: 20,
    protocols: [{ slug: "ethernet", isPrimary: true }],
    capabilities: [CapabilityCode.ON_OFF, CapabilityCode.ENERGY_MONITORING],
    infrastructureRequirements: [
      InfrastructureRequirementCode.ETHERNET,
      InfrastructureRequirementCode.UPS_RECOMMENDED,
      InfrastructureRequirementCode.VLAN_RECOMMENDED,
    ],
    ecosystemCompatibilities: [
      { slug: "home-assistant", level: CompatibilityLevel.LIMITED },
      { slug: "alexa", level: CompatibilityLevel.NOT_SUPPORTED },
      { slug: "google-home", level: CompatibilityLevel.NOT_SUPPORTED },
      { slug: "homekit", level: CompatibilityLevel.NOT_SUPPORTED },
      { slug: "tuya", level: CompatibilityLevel.NOT_SUPPORTED },
    ],
    suppliers: [
      {
        supplierKey: "ubiquiti-store",
        supplierSku: "USP-RPS",
        productUrl: "https://store.ui.com/us/en/products/usp-rps",
        currency: "USD",
        price: 399,
        stockStatus: StockStatus.IN_STOCK,
        estimatedDeliveryDays: 10,
        isPreferredSupplier: true,
      },
      {
        supplierKey: "intcomex-co",
        supplierSku: "USP-RPS",
        productUrl: "https://www.intcomex.com/search?query=USP-RPS",
        currency: "USD",
        price: 419,
        stockStatus: StockStatus.BACKORDER,
        estimatedDeliveryDays: 14,
      },
    ],
  },
  {
    brandSlug: "tp-link",
    productType: ProductType.CAMERA,
    name: "TP-Link Tapo C520WS",
    slug: "tp-link-tapo-c520ws",
    sku: "Tapo C520WS",
    modelCode: "Tapo C520WS",
    description: "Outdoor pan/tilt WiFi camera with starlight optics and local recording.",
    requiresNeutral: false,
    localControl: true,
    cloudRequired: false,
    installationDifficulty: InstallationDifficulty.MEDIUM,
    recommendedTier: RecommendedTier.STANDARD,
    powerConsumption: 8,
    protocols: [{ slug: "wifi", isPrimary: true }],
    capabilities: [CapabilityCode.VIDEO, CapabilityCode.AUDIO, CapabilityCode.MOTION],
    infrastructureRequirements: [InfrastructureRequirementCode.GOOD_WIFI],
    ecosystemCompatibilities: [
      { slug: "home-assistant", level: CompatibilityLevel.COMPATIBLE, notes: "RTSP/ONVIF in local networks." },
      { slug: "alexa", level: CompatibilityLevel.CERTIFIED, requiresCloudLink: true },
      { slug: "google-home", level: CompatibilityLevel.CERTIFIED, requiresCloudLink: true },
      { slug: "homekit", level: CompatibilityLevel.NOT_SUPPORTED },
      { slug: "tuya", level: CompatibilityLevel.NOT_SUPPORTED },
    ],
    suppliers: [
      {
        supplierKey: "mercadolibre-co",
        supplierSku: "Tapo C520WS",
        productUrl: "https://listado.mercadolibre.com.co/tapo-c520ws",
        currency: "COP",
        price: 429000,
        stockStatus: StockStatus.IN_STOCK,
        estimatedDeliveryDays: 2,
        isPreferredSupplier: true,
      },
      {
        supplierKey: "amazon-us",
        supplierSku: "Tapo C520WS",
        productUrl: "https://www.amazon.com/s?k=Tapo+C520WS",
        currency: "USD",
        price: 89.99,
        stockStatus: StockStatus.IN_STOCK,
        estimatedDeliveryDays: 8,
      },
    ],
  },
  {
    brandSlug: "aqara",
    productType: ProductType.CURTAIN,
    name: "Aqara Curtain Driver E1",
    slug: "aqara-curtain-driver-e1",
    sku: "CM-M01",
    modelCode: "CM-M01",
    description: "Zigbee curtain motor for retrofit rails with local automation support.",
    requiresNeutral: false,
    localControl: true,
    cloudRequired: false,
    installationDifficulty: InstallationDifficulty.MEDIUM,
    recommendedTier: RecommendedTier.STANDARD,
    powerConsumption: 5,
    protocols: [{ slug: "zigbee", isPrimary: true }],
    capabilities: [CapabilityCode.ON_OFF],
    infrastructureRequirements: [InfrastructureRequirementCode.GOOD_WIFI],
    ecosystemCompatibilities: [
      { slug: "home-assistant", level: CompatibilityLevel.CERTIFIED, requiresBridge: true },
      { slug: "alexa", level: CompatibilityLevel.COMPATIBLE, requiresBridge: true, requiresCloudLink: true },
      { slug: "google-home", level: CompatibilityLevel.COMPATIBLE, requiresBridge: true, requiresCloudLink: true },
      { slug: "homekit", level: CompatibilityLevel.COMPATIBLE, requiresBridge: true },
      { slug: "tuya", level: CompatibilityLevel.NOT_SUPPORTED },
    ],
    hubRelations: [{ hubSlug: "aqara-hub-m3", relationType: HubRelationType.OPTIONAL }],
    suppliers: [
      {
        supplierKey: "amazon-us",
        supplierSku: "CM-M01",
        productUrl: "https://www.amazon.com/s?k=Aqara+Curtain+Driver+E1",
        currency: "USD",
        price: 89.99,
        stockStatus: StockStatus.IN_STOCK,
        estimatedDeliveryDays: 9,
        isPreferredSupplier: true,
      },
      {
        supplierKey: "mercadolibre-co",
        supplierSku: "CM-M01",
        productUrl: "https://listado.mercadolibre.com.co/aqara-curtain-driver-e1",
        currency: "COP",
        price: 429000,
        stockStatus: StockStatus.LOW_STOCK,
        estimatedDeliveryDays: 5,
      },
    ],
  },
  {
    brandSlug: "aqara",
    productType: ProductType.LOCK,
    name: "Aqara Smart Lock U100",
    slug: "aqara-smart-lock-u100",
    sku: "DL-D100-ZN",
    modelCode: "DL-D100-ZN",
    description: "Matter and HomeKey-ready retrofit smart lock with local automations.",
    requiresNeutral: false,
    localControl: true,
    cloudRequired: false,
    installationDifficulty: InstallationDifficulty.HIGH,
    recommendedTier: RecommendedTier.PRO,
    powerConsumption: 2,
    protocols: [
      { slug: "matter", isPrimary: true, minVersion: "1.2" },
      { slug: "thread" },
      { slug: "zigbee" },
    ],
    capabilities: [CapabilityCode.ON_OFF, CapabilityCode.PRESENCE],
    infrastructureRequirements: [InfrastructureRequirementCode.MESH_WIFI, InfrastructureRequirementCode.GOOD_WIFI],
    ecosystemCompatibilities: [
      { slug: "home-assistant", level: CompatibilityLevel.COMPATIBLE },
      { slug: "alexa", level: CompatibilityLevel.COMPATIBLE, requiresCloudLink: true },
      { slug: "google-home", level: CompatibilityLevel.COMPATIBLE, requiresCloudLink: true },
      { slug: "homekit", level: CompatibilityLevel.CERTIFIED },
      { slug: "tuya", level: CompatibilityLevel.NOT_SUPPORTED },
    ],
    suppliers: [
      {
        supplierKey: "amazon-us",
        supplierSku: "DL-D100-ZN",
        productUrl: "https://www.amazon.com/s?k=Aqara+U100",
        currency: "USD",
        price: 189.99,
        stockStatus: StockStatus.IN_STOCK,
        estimatedDeliveryDays: 9,
        isPreferredSupplier: true,
      },
      {
        supplierKey: "mercadolibre-co",
        supplierSku: "DL-D100-ZN",
        productUrl: "https://listado.mercadolibre.com.co/aqara-u100",
        currency: "COP",
        price: 949000,
        stockStatus: StockStatus.BACKORDER,
        estimatedDeliveryDays: 12,
      },
    ],
  },
  {
    brandSlug: "shelly",
    productType: ProductType.HVAC,
    name: "Shelly Plus 1",
    slug: "shelly-plus-1-hvac-relay",
    sku: "SNSW-001X16EU",
    modelCode: "SNSW-001X16EU",
    description: "WiFi dry-contact relay commonly used for HVAC thermostat integrations.",
    requiresNeutral: true,
    localControl: true,
    cloudRequired: false,
    installationDifficulty: InstallationDifficulty.MEDIUM,
    recommendedTier: RecommendedTier.STANDARD,
    powerConsumption: 1,
    protocols: [{ slug: "wifi", isPrimary: true }],
    capabilities: [CapabilityCode.ON_OFF],
    infrastructureRequirements: [InfrastructureRequirementCode.GOOD_WIFI],
    ecosystemCompatibilities: [
      { slug: "home-assistant", level: CompatibilityLevel.CERTIFIED },
      { slug: "alexa", level: CompatibilityLevel.COMPATIBLE, requiresCloudLink: true },
      { slug: "google-home", level: CompatibilityLevel.COMPATIBLE, requiresCloudLink: true },
      { slug: "homekit", level: CompatibilityLevel.LIMITED },
      { slug: "tuya", level: CompatibilityLevel.NOT_SUPPORTED },
    ],
    suppliers: [
      {
        supplierKey: "smarthouse-co",
        supplierSku: "SNSW-001X16EU",
        productUrl: "https://smarthousecolombia.com/search?q=Shelly+Plus+1",
        currency: "COP",
        price: 89000,
        stockStatus: StockStatus.IN_STOCK,
        estimatedDeliveryDays: 2,
        isPreferredSupplier: true,
      },
      {
        supplierKey: "amazon-us",
        supplierSku: "SNSW-001X16EU",
        productUrl: "https://www.amazon.com/s?k=Shelly+Plus+1",
        currency: "USD",
        price: 17.99,
        stockStatus: StockStatus.IN_STOCK,
        estimatedDeliveryDays: 8,
      },
    ],
  },
  {
    brandSlug: "sonoff",
    productType: ProductType.IR_BLASTER,
    name: "Sonoff iHost Smart Home Hub",
    slug: "sonoff-ihost",
    sku: "iHost",
    modelCode: "AIBridge-26",
    description: "Local-first controller with add-ons for bridging and IR-centric automations.",
    requiresNeutral: false,
    localControl: true,
    cloudRequired: false,
    installationDifficulty: InstallationDifficulty.MEDIUM,
    recommendedTier: RecommendedTier.PRO,
    powerConsumption: 6,
    protocols: [{ slug: "ethernet", isPrimary: true }, { slug: "wifi" }, { slug: "zigbee" }],
    capabilities: [CapabilityCode.IR_CONTROL, CapabilityCode.ON_OFF],
    infrastructureRequirements: [
      InfrastructureRequirementCode.ETHERNET,
      InfrastructureRequirementCode.UPS_RECOMMENDED,
    ],
    ecosystemCompatibilities: [
      { slug: "home-assistant", level: CompatibilityLevel.COMPATIBLE, notes: "Can coexist and bridge with Home Assistant." },
      { slug: "alexa", level: CompatibilityLevel.LIMITED },
      { slug: "google-home", level: CompatibilityLevel.LIMITED },
      { slug: "homekit", level: CompatibilityLevel.NOT_SUPPORTED },
      { slug: "tuya", level: CompatibilityLevel.NOT_SUPPORTED },
    ],
    suppliers: [
      {
        supplierKey: "amazon-us",
        supplierSku: "AIBridge-26",
        productUrl: "https://www.amazon.com/s?k=Sonoff+iHost",
        currency: "USD",
        price: 129,
        stockStatus: StockStatus.IN_STOCK,
        estimatedDeliveryDays: 8,
        isPreferredSupplier: true,
      },
      {
        supplierKey: "mercadolibre-co",
        supplierSku: "AIBridge-26",
        productUrl: "https://listado.mercadolibre.com.co/sonoff-ihost",
        currency: "COP",
        price: 579000,
        stockStatus: StockStatus.LOW_STOCK,
        estimatedDeliveryDays: 4,
      },
    ],
  },
];

const hubGateways = [
  {
    brandSlug: "aqara",
    name: "Aqara Hub M3",
    slug: "aqara-hub-m3",
    modelCode: "HM-G01D",
    supportsLocalControl: true,
    cloudRequired: false,
    maxDevices: 127,
    notes: "Recommended Aqara bridge; can coexist with Home Assistant.",
  },
  {
    brandSlug: "sonoff",
    name: "Sonoff ZBBridge-P",
    slug: "sonoff-zbbridge-p",
    modelCode: "ZBBridge-P",
    supportsLocalControl: true,
    cloudRequired: false,
    maxDevices: 64,
    notes: "Useful Zigbee bridge for Sonoff/Aqara in retrofit projects.",
  },
  {
    brandSlug: "ubiquiti",
    name: "Ubiquiti UDM SE",
    slug: "ubiquiti-udm-se-hub",
    modelCode: "UDM-SE",
    supportsLocalControl: true,
    cloudRequired: false,
    maxDevices: 200,
    notes: "Network core used as automation infrastructure anchor.",
  },
] as const;

async function main() {
  const curatedProductSlugs = new Set([
    "aqara-h1-no-neutral",
    "aqara-motion-sensor-p1",
    "aqara-door-window-sensor-p2",
    "aqara-curtain-driver-e1",
    "aqara-smart-lock-u100",
    "sonoff-zbmini-l2",
    "sonoff-zbmini-r2",
    "sonoff-nspanel-pro",
    "sonoff-snzb-02d",
    "sonoff-zbbridge-p-product",
    "shelly-1pm-gen3",
    "shelly-dimmer-2",
    "shelly-plus-i4",
    "shelly-ht-gen3",
    "shelly-pro-4pm",
    "shelly-plus-1-hvac-relay",
    "tp-link-tapo-p110m",
    "tp-link-tapo-c225",
    "tp-link-deco-x55-3pack",
    "tp-link-tapo-c520ws",
    "hikvision-ds-2cd2143g2-i",
    "hikvision-ax-pro-ds-pwa96-m-we",
    "ubiquiti-udm-se",
    "ubiquiti-unifi-6-lite",
    "ubiquiti-usw-lite-8-poe",
  ]);

  const curatedProducts = products.filter((product) =>
    curatedProductSlugs.has(product.slug),
  );

  const brandIds = new Map<string, string>();
  const protocolIds = new Map<string, string>();
  const ecosystemIds = new Map<string, string>();
  const supplierIds = new Map<string, string>();
  const capabilityIds = new Map<CapabilityCode, string>();
  const infrastructureIds = new Map<InfrastructureRequirementCode, string>();
  const hubIds = new Map<string, string>();

  for (const brand of brands) {
    const row = await prisma.brand.upsert({
      where: { slug: brand.slug },
      update: { name: brand.name, website: brand.website },
      create: { name: brand.name, slug: brand.slug, website: brand.website },
    });
    brandIds.set(brand.slug, row.id);
  }

  for (const protocol of protocols) {
    const row = await prisma.protocol.upsert({
      where: { slug: protocol.slug },
      update: {
        name: protocol.name,
        description: protocol.description,
      },
      create: {
        name: protocol.name,
        slug: protocol.slug,
        description: protocol.description,
      },
    });
    protocolIds.set(protocol.slug, row.id);
  }

  for (const ecosystem of ecosystems) {
    const row = await prisma.ecosystem.upsert({
      where: { slug: ecosystem.slug },
      update: {
        name: ecosystem.name,
        vendor: ecosystem.vendor,
        description: ecosystem.description,
      },
      create: {
        name: ecosystem.name,
        slug: ecosystem.slug,
        vendor: ecosystem.vendor,
        description: ecosystem.description,
      },
    });
    ecosystemIds.set(ecosystem.slug, row.id);
  }

  for (const capability of capabilities) {
    const row = await prisma.capability.upsert({
      where: { code: capability.code },
      update: {
        name: capability.name,
        description: capability.description,
      },
      create: {
        code: capability.code,
        name: capability.name,
        description: capability.description,
      },
    });
    capabilityIds.set(capability.code, row.id);
  }

  for (const infra of infrastructureRequirements) {
    const row = await prisma.infrastructureRequirement.upsert({
      where: { code: infra.code },
      update: {
        name: infra.name,
        description: infra.description,
      },
      create: {
        code: infra.code,
        name: infra.name,
        description: infra.description,
      },
    });
    infrastructureIds.set(infra.code, row.id);
  }

  for (const supplier of suppliers) {
    const row = await prisma.supplier.upsert({
      where: { id: supplier.id },
      update: {
        name: supplier.name,
        website: supplier.website,
        country: supplier.country,
        supportsLocalStock: supplier.supportsLocalStock,
        notes: supplier.notes,
      },
      create: {
        id: supplier.id,
        name: supplier.name,
        website: supplier.website,
        country: supplier.country,
        supportsLocalStock: supplier.supportsLocalStock,
        notes: supplier.notes,
      },
    });
    supplierIds.set(supplier.key, row.id);
  }

  for (const hub of hubGateways) {
    const brandId = brandIds.get(hub.brandSlug);
    if (!brandId) {
      throw new Error(`Brand not found for hub: ${hub.brandSlug}`);
    }

    const row = await prisma.hubGateway.upsert({
      where: { slug: hub.slug },
      update: {
        brandId,
        name: hub.name,
        modelCode: hub.modelCode,
        supportsLocalControl: hub.supportsLocalControl,
        cloudRequired: hub.cloudRequired,
        maxDevices: hub.maxDevices,
        notes: hub.notes,
      },
      create: {
        brandId,
        name: hub.name,
        slug: hub.slug,
        modelCode: hub.modelCode,
        supportsLocalControl: hub.supportsLocalControl,
        cloudRequired: hub.cloudRequired,
        maxDevices: hub.maxDevices,
        notes: hub.notes,
      },
    });

    hubIds.set(hub.slug, row.id);
  }

  for (const product of curatedProducts) {
    const brandId = brandIds.get(product.brandSlug);
    if (!brandId) {
      throw new Error(`Brand not found for product: ${product.brandSlug}`);
    }

    const row = await prisma.product.upsert({
      where: { slug: product.slug },
      update: {
        brandId,
        productType: product.productType,
        name: product.name,
        sku: product.sku,
        modelCode: product.modelCode,
        description: product.description,
        requiresNeutral: product.requiresNeutral,
        localControl: product.localControl,
        cloudRequired: product.cloudRequired,
        installationDifficulty: product.installationDifficulty,
        recommendedTier: product.recommendedTier,
        powerConsumption: product.powerConsumption
          ? new Prisma.Decimal(product.powerConsumption)
          : null,
        activePowerUnit: product.activePowerUnit ?? "W",
      },
      create: {
        brandId,
        productType: product.productType,
        name: product.name,
        slug: product.slug,
        sku: product.sku,
        modelCode: product.modelCode,
        description: product.description,
        requiresNeutral: product.requiresNeutral,
        localControl: product.localControl,
        cloudRequired: product.cloudRequired,
        installationDifficulty: product.installationDifficulty,
        recommendedTier: product.recommendedTier,
        powerConsumption: product.powerConsumption
          ? new Prisma.Decimal(product.powerConsumption)
          : null,
        activePowerUnit: product.activePowerUnit ?? "W",
      },
    });

    for (const protocolLink of product.protocols) {
      const protocolId = protocolIds.get(protocolLink.slug);
      if (!protocolId) {
        throw new Error(`Protocol not found: ${protocolLink.slug}`);
      }

      await prisma.productProtocol.upsert({
        where: {
          productId_protocolId: {
            productId: row.id,
            protocolId,
          },
        },
        update: {
          isPrimary: protocolLink.isPrimary ?? false,
          minVersion: protocolLink.minVersion,
          notes: protocolLink.notes,
        },
        create: {
          productId: row.id,
          protocolId,
          isPrimary: protocolLink.isPrimary ?? false,
          minVersion: protocolLink.minVersion,
          notes: protocolLink.notes,
        },
      });
    }

    for (const code of product.capabilities) {
      const capabilityId = capabilityIds.get(code);
      if (!capabilityId) {
        throw new Error(`Capability not found: ${code}`);
      }

      await prisma.productCapability.upsert({
        where: {
          productId_capabilityId: {
            productId: row.id,
            capabilityId,
          },
        },
        update: {},
        create: {
          productId: row.id,
          capabilityId,
        },
      });
    }

    for (const infraCode of product.infrastructureRequirements) {
      const infrastructureRequirementId = infrastructureIds.get(infraCode);
      if (!infrastructureRequirementId) {
        throw new Error(`Infrastructure requirement not found: ${infraCode}`);
      }

      await prisma.productInfrastructureRequirement.upsert({
        where: {
          productId_infrastructureRequirementId: {
            productId: row.id,
            infrastructureRequirementId,
          },
        },
        update: {},
        create: {
          productId: row.id,
          infrastructureRequirementId,
        },
      });
    }

    for (const compatibility of product.ecosystemCompatibilities) {
      const ecosystemId = ecosystemIds.get(compatibility.slug);
      if (!ecosystemId) {
        throw new Error(`Ecosystem not found: ${compatibility.slug}`);
      }

      await prisma.productEcosystemCompatibility.upsert({
        where: {
          productId_ecosystemId: {
            productId: row.id,
            ecosystemId,
          },
        },
        update: {
          level: compatibility.level,
          requiresBridge: compatibility.requiresBridge ?? false,
          requiresCloudLink: compatibility.requiresCloudLink ?? false,
          notes: compatibility.notes,
          testedAt: new Date(),
        },
        create: {
          productId: row.id,
          ecosystemId,
          level: compatibility.level,
          requiresBridge: compatibility.requiresBridge ?? false,
          requiresCloudLink: compatibility.requiresCloudLink ?? false,
          notes: compatibility.notes,
          testedAt: new Date(),
        },
      });
    }

    for (const supplierLink of product.suppliers) {
      const supplierId = supplierIds.get(supplierLink.supplierKey);
      if (!supplierId) {
        throw new Error(`Supplier not found: ${supplierLink.supplierKey}`);
      }

      await prisma.productSupplier.upsert({
        where: {
          productId_supplierId: {
            productId: row.id,
            supplierId,
          },
        },
        update: {
          supplierSku: supplierLink.supplierSku,
          productUrl: supplierLink.productUrl,
          currency: supplierLink.currency,
          price: typeof supplierLink.price === "number" ? new Prisma.Decimal(supplierLink.price) : null,
          stockStatus: supplierLink.stockStatus ?? StockStatus.IN_STOCK,
          estimatedDeliveryDays: supplierLink.estimatedDeliveryDays,
          lastValidatedAt: new Date(),
          isPreferredSupplier: supplierLink.isPreferredSupplier ?? false,
        },
        create: {
          productId: row.id,
          supplierId,
          supplierSku: supplierLink.supplierSku,
          productUrl: supplierLink.productUrl,
          currency: supplierLink.currency,
          price: typeof supplierLink.price === "number" ? new Prisma.Decimal(supplierLink.price) : null,
          stockStatus: supplierLink.stockStatus ?? StockStatus.IN_STOCK,
          estimatedDeliveryDays: supplierLink.estimatedDeliveryDays,
          lastValidatedAt: new Date(),
          isPreferredSupplier: supplierLink.isPreferredSupplier ?? false,
        },
      });
    }

    for (const hubRelation of product.hubRelations ?? []) {
      const hubId = hubIds.get(hubRelation.hubSlug);
      if (!hubId) {
        throw new Error(`Hub not found: ${hubRelation.hubSlug}`);
      }

      await prisma.productHubGateway.upsert({
        where: {
          productId_hubId: {
            productId: row.id,
            hubId,
          },
        },
        update: {
          relationType: hubRelation.relationType,
          notes: hubRelation.notes,
        },
        create: {
          productId: row.id,
          hubId,
          relationType: hubRelation.relationType,
          notes: hubRelation.notes,
        },
      });
    }
  }

  console.info(`Seed completed with ${curatedProducts.length} curated products.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
