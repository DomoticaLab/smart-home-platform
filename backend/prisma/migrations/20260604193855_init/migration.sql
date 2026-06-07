-- CreateEnum
CREATE TYPE "InstallationDifficulty" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'EXPERT');

-- CreateEnum
CREATE TYPE "RecommendedTier" AS ENUM ('ENTRY', 'STANDARD', 'PRO', 'ENTERPRISE');

-- CreateEnum
CREATE TYPE "ProductType" AS ENUM ('SWITCH', 'DIMMER', 'SENSOR', 'RELAY', 'CAMERA', 'CURTAIN', 'LOCK', 'HUB', 'PANEL', 'IR_BLASTER', 'ROUTER', 'UPS', 'SPEAKER', 'HVAC', 'OTHER');

-- CreateEnum
CREATE TYPE "CompatibilityLevel" AS ENUM ('CERTIFIED', 'COMPATIBLE', 'LIMITED', 'EXPERIMENTAL', 'NOT_SUPPORTED');

-- CreateEnum
CREATE TYPE "HubRelationType" AS ENUM ('REQUIRED', 'OPTIONAL', 'NATIVE');

-- CreateEnum
CREATE TYPE "AutomationRole" AS ENUM ('TRIGGER', 'CONDITION', 'ACTION');

-- CreateEnum
CREATE TYPE "QuoteStatus" AS ENUM ('DRAFT', 'REVIEW', 'FINAL', 'APPROVED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "StockStatus" AS ENUM ('IN_STOCK', 'LOW_STOCK', 'BACKORDER', 'OUT_OF_STOCK', 'DISCONTINUED');

-- CreateEnum
CREATE TYPE "CapabilityCode" AS ENUM ('ON_OFF', 'DIMMING', 'RGB', 'MOTION', 'TEMPERATURE', 'HUMIDITY', 'POWER_MONITORING', 'IR_CONTROL', 'AUDIO', 'VIDEO', 'PRESENCE', 'ENERGY_MONITORING');

-- CreateEnum
CREATE TYPE "InfrastructureRequirementCode" AS ENUM ('GOOD_WIFI', 'MESH_WIFI', 'ETHERNET', 'UPS_RECOMMENDED', 'VLAN_RECOMMENDED', 'POE_REQUIRED');

-- CreateEnum
CREATE TYPE "PowerUnit" AS ENUM ('W', 'VA', 'KW');

-- CreateTable
CREATE TABLE "Brand" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "website" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Brand_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductCategory" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "parentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Protocol" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Protocol_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Ecosystem" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "vendor" TEXT,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Ecosystem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Supplier" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "website" TEXT,
    "country" TEXT,
    "supportsLocalStock" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Supplier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Capability" (
    "id" TEXT NOT NULL,
    "code" "CapabilityCode" NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Capability_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InfrastructureRequirement" (
    "id" TEXT NOT NULL,
    "code" "InfrastructureRequirementCode" NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InfrastructureRequirement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HubGateway" (
    "id" TEXT NOT NULL,
    "brandId" TEXT,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "modelCode" TEXT,
    "supportsLocalControl" BOOLEAN NOT NULL DEFAULT true,
    "cloudRequired" BOOLEAN NOT NULL DEFAULT false,
    "maxDevices" INTEGER,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HubGateway_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Product" (
    "id" TEXT NOT NULL,
    "brandId" TEXT NOT NULL,
    "productType" "ProductType" NOT NULL DEFAULT 'OTHER',
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "sku" TEXT,
    "modelCode" TEXT,
    "description" TEXT,
    "requiresNeutral" BOOLEAN NOT NULL DEFAULT false,
    "localControl" BOOLEAN NOT NULL DEFAULT true,
    "cloudRequired" BOOLEAN NOT NULL DEFAULT false,
    "installationDifficulty" "InstallationDifficulty" NOT NULL DEFAULT 'MEDIUM',
    "recommendedTier" "RecommendedTier" NOT NULL DEFAULT 'STANDARD',
    "powerConsumption" DECIMAL(10,2),
    "activePowerUnit" "PowerUnit" DEFAULT 'W',
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductCategoryLink" (
    "productId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProductCategoryLink_pkey" PRIMARY KEY ("productId","categoryId")
);

-- CreateTable
CREATE TABLE "ProductProtocol" (
    "productId" TEXT NOT NULL,
    "protocolId" TEXT NOT NULL,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "minVersion" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProductProtocol_pkey" PRIMARY KEY ("productId","protocolId")
);

-- CreateTable
CREATE TABLE "ProductSupplier" (
    "productId" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "supplierSku" TEXT,
    "productUrl" TEXT,
    "currency" VARCHAR(3),
    "price" DECIMAL(12,2),
    "stockStatus" "StockStatus" NOT NULL DEFAULT 'IN_STOCK',
    "estimatedDeliveryDays" INTEGER,
    "lastValidatedAt" TIMESTAMP(3),
    "isPreferredSupplier" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductSupplier_pkey" PRIMARY KEY ("productId","supplierId")
);

-- CreateTable
CREATE TABLE "ProductCapability" (
    "productId" TEXT NOT NULL,
    "capabilityId" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProductCapability_pkey" PRIMARY KEY ("productId","capabilityId")
);

-- CreateTable
CREATE TABLE "ProductInfrastructureRequirement" (
    "productId" TEXT NOT NULL,
    "infrastructureRequirementId" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProductInfrastructureRequirement_pkey" PRIMARY KEY ("productId","infrastructureRequirementId")
);

-- CreateTable
CREATE TABLE "ProductEcosystemCompatibility" (
    "productId" TEXT NOT NULL,
    "ecosystemId" TEXT NOT NULL,
    "level" "CompatibilityLevel" NOT NULL DEFAULT 'COMPATIBLE',
    "requiresBridge" BOOLEAN NOT NULL DEFAULT false,
    "requiresCloudLink" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "testedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProductEcosystemCompatibility_pkey" PRIMARY KEY ("productId","ecosystemId")
);

-- CreateTable
CREATE TABLE "InstallationRequirement" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "mandatory" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InstallationRequirement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductInstallationRequirement" (
    "productId" TEXT NOT NULL,
    "requirementId" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProductInstallationRequirement_pkey" PRIMARY KEY ("productId","requirementId")
);

-- CreateTable
CREATE TABLE "ProductHubGateway" (
    "productId" TEXT NOT NULL,
    "hubId" TEXT NOT NULL,
    "relationType" "HubRelationType" NOT NULL DEFAULT 'OPTIONAL',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProductHubGateway_pkey" PRIMARY KEY ("productId","hubId")
);

-- CreateTable
CREATE TABLE "AutomationTemplate" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AutomationTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AutomationTemplateProduct" (
    "id" TEXT NOT NULL,
    "automationId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "role" "AutomationRole" NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,

    CONSTRAINT "AutomationTemplateProduct_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SceneTemplate" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SceneTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SceneTemplateProduct" (
    "sceneId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "actionLabel" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SceneTemplateProduct_pkey" PRIMARY KEY ("sceneId","productId")
);

-- CreateTable
CREATE TABLE "Bundle" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "basePrice" DECIMAL(12,2),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "tier" "RecommendedTier" NOT NULL DEFAULT 'STANDARD',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Bundle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BundleItem" (
    "bundleId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "isOptional" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BundleItem_pkey" PRIMARY KEY ("bundleId","productId")
);

-- CreateTable
CREATE TABLE "QuoteBundle" (
    "quoteId" TEXT NOT NULL,
    "bundleId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QuoteBundle_pkey" PRIMARY KEY ("quoteId","bundleId")
);

-- CreateTable
CREATE TABLE "Client" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "city" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Client_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Room" (
    "id" TEXT NOT NULL,
    "quoteId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "floor" INTEGER DEFAULT 1,
    "areaSqm" DECIMAL(6,2),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Room_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Quote" (
    "id" TEXT NOT NULL,
    "clientId" TEXT,
    "quoteNumber" TEXT NOT NULL,
    "status" "QuoteStatus" NOT NULL DEFAULT 'DRAFT',
    "projectName" TEXT,
    "projectAddress" TEXT,
    "notes" TEXT,
    "estimatedSubtotal" DECIMAL(12,2),
    "estimatedTotal" DECIMAL(12,2),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Quote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuoteItem" (
    "id" TEXT NOT NULL,
    "quoteId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "roomId" TEXT,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "unitPrice" DECIMAL(12,2),
    "estimatedInstall" DECIMAL(12,2),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QuoteItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Brand_name_idx" ON "Brand"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Brand_slug_key" ON "Brand"("slug");

-- CreateIndex
CREATE INDEX "ProductCategory_parentId_idx" ON "ProductCategory"("parentId");

-- CreateIndex
CREATE UNIQUE INDEX "ProductCategory_slug_key" ON "ProductCategory"("slug");

-- CreateIndex
CREATE INDEX "Protocol_name_idx" ON "Protocol"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Protocol_slug_key" ON "Protocol"("slug");

-- CreateIndex
CREATE INDEX "Ecosystem_name_idx" ON "Ecosystem"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Ecosystem_slug_key" ON "Ecosystem"("slug");

-- CreateIndex
CREATE INDEX "Supplier_name_idx" ON "Supplier"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Capability_code_key" ON "Capability"("code");

-- CreateIndex
CREATE UNIQUE INDEX "InfrastructureRequirement_code_key" ON "InfrastructureRequirement"("code");

-- CreateIndex
CREATE INDEX "HubGateway_brandId_idx" ON "HubGateway"("brandId");

-- CreateIndex
CREATE UNIQUE INDEX "HubGateway_slug_key" ON "HubGateway"("slug");

-- CreateIndex
CREATE INDEX "Product_brandId_idx" ON "Product"("brandId");

-- CreateIndex
CREATE INDEX "Product_productType_idx" ON "Product"("productType");

-- CreateIndex
CREATE INDEX "Product_recommendedTier_idx" ON "Product"("recommendedTier");

-- CreateIndex
CREATE UNIQUE INDEX "Product_slug_key" ON "Product"("slug");

-- CreateIndex
CREATE INDEX "ProductCategoryLink_categoryId_idx" ON "ProductCategoryLink"("categoryId");

-- CreateIndex
CREATE INDEX "ProductProtocol_protocolId_idx" ON "ProductProtocol"("protocolId");

-- CreateIndex
CREATE INDEX "ProductSupplier_supplierId_stockStatus_idx" ON "ProductSupplier"("supplierId", "stockStatus");

-- CreateIndex
CREATE INDEX "ProductSupplier_isPreferredSupplier_idx" ON "ProductSupplier"("isPreferredSupplier");

-- CreateIndex
CREATE INDEX "ProductCapability_capabilityId_idx" ON "ProductCapability"("capabilityId");

-- CreateIndex
CREATE INDEX "ProductInfrastructureRequirement_infrastructureRequirementI_idx" ON "ProductInfrastructureRequirement"("infrastructureRequirementId");

-- CreateIndex
CREATE INDEX "ProductEcosystemCompatibility_ecosystemId_level_idx" ON "ProductEcosystemCompatibility"("ecosystemId", "level");

-- CreateIndex
CREATE INDEX "InstallationRequirement_mandatory_idx" ON "InstallationRequirement"("mandatory");

-- CreateIndex
CREATE UNIQUE INDEX "InstallationRequirement_slug_key" ON "InstallationRequirement"("slug");

-- CreateIndex
CREATE INDEX "ProductInstallationRequirement_requirementId_idx" ON "ProductInstallationRequirement"("requirementId");

-- CreateIndex
CREATE INDEX "ProductHubGateway_hubId_relationType_idx" ON "ProductHubGateway"("hubId", "relationType");

-- CreateIndex
CREATE INDEX "AutomationTemplate_isActive_idx" ON "AutomationTemplate"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "AutomationTemplate_slug_key" ON "AutomationTemplate"("slug");

-- CreateIndex
CREATE INDEX "AutomationTemplateProduct_automationId_idx" ON "AutomationTemplateProduct"("automationId");

-- CreateIndex
CREATE INDEX "AutomationTemplateProduct_productId_role_idx" ON "AutomationTemplateProduct"("productId", "role");

-- CreateIndex
CREATE UNIQUE INDEX "AutomationTemplateProduct_automationId_productId_role_key" ON "AutomationTemplateProduct"("automationId", "productId", "role");

-- CreateIndex
CREATE INDEX "SceneTemplate_isActive_idx" ON "SceneTemplate"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "SceneTemplate_slug_key" ON "SceneTemplate"("slug");

-- CreateIndex
CREATE INDEX "SceneTemplateProduct_productId_idx" ON "SceneTemplateProduct"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "Bundle_slug_key" ON "Bundle"("slug");

-- CreateIndex
CREATE INDEX "Bundle_isActive_idx" ON "Bundle"("isActive");

-- CreateIndex
CREATE INDEX "Bundle_tier_idx" ON "Bundle"("tier");

-- CreateIndex
CREATE INDEX "BundleItem_productId_idx" ON "BundleItem"("productId");

-- CreateIndex
CREATE INDEX "QuoteBundle_bundleId_idx" ON "QuoteBundle"("bundleId");

-- CreateIndex
CREATE INDEX "Client_name_idx" ON "Client"("name");

-- CreateIndex
CREATE INDEX "Room_quoteId_idx" ON "Room"("quoteId");

-- CreateIndex
CREATE INDEX "Quote_clientId_idx" ON "Quote"("clientId");

-- CreateIndex
CREATE INDEX "Quote_status_idx" ON "Quote"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Quote_quoteNumber_key" ON "Quote"("quoteNumber");

-- CreateIndex
CREATE INDEX "QuoteItem_productId_idx" ON "QuoteItem"("productId");

-- CreateIndex
CREATE INDEX "QuoteItem_roomId_idx" ON "QuoteItem"("roomId");

-- CreateIndex
CREATE UNIQUE INDEX "QuoteItem_quoteId_productId_key" ON "QuoteItem"("quoteId", "productId");

-- AddForeignKey
ALTER TABLE "ProductCategory" ADD CONSTRAINT "ProductCategory_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "ProductCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HubGateway" ADD CONSTRAINT "HubGateway_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductCategoryLink" ADD CONSTRAINT "ProductCategoryLink_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductCategoryLink" ADD CONSTRAINT "ProductCategoryLink_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "ProductCategory"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductProtocol" ADD CONSTRAINT "ProductProtocol_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductProtocol" ADD CONSTRAINT "ProductProtocol_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "Protocol"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductSupplier" ADD CONSTRAINT "ProductSupplier_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductSupplier" ADD CONSTRAINT "ProductSupplier_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductCapability" ADD CONSTRAINT "ProductCapability_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductCapability" ADD CONSTRAINT "ProductCapability_capabilityId_fkey" FOREIGN KEY ("capabilityId") REFERENCES "Capability"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductInfrastructureRequirement" ADD CONSTRAINT "ProductInfrastructureRequirement_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductInfrastructureRequirement" ADD CONSTRAINT "ProductInfrastructureRequirement_infrastructureRequirement_fkey" FOREIGN KEY ("infrastructureRequirementId") REFERENCES "InfrastructureRequirement"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductEcosystemCompatibility" ADD CONSTRAINT "ProductEcosystemCompatibility_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductEcosystemCompatibility" ADD CONSTRAINT "ProductEcosystemCompatibility_ecosystemId_fkey" FOREIGN KEY ("ecosystemId") REFERENCES "Ecosystem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductInstallationRequirement" ADD CONSTRAINT "ProductInstallationRequirement_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductInstallationRequirement" ADD CONSTRAINT "ProductInstallationRequirement_requirementId_fkey" FOREIGN KEY ("requirementId") REFERENCES "InstallationRequirement"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductHubGateway" ADD CONSTRAINT "ProductHubGateway_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductHubGateway" ADD CONSTRAINT "ProductHubGateway_hubId_fkey" FOREIGN KEY ("hubId") REFERENCES "HubGateway"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AutomationTemplateProduct" ADD CONSTRAINT "AutomationTemplateProduct_automationId_fkey" FOREIGN KEY ("automationId") REFERENCES "AutomationTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AutomationTemplateProduct" ADD CONSTRAINT "AutomationTemplateProduct_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SceneTemplateProduct" ADD CONSTRAINT "SceneTemplateProduct_sceneId_fkey" FOREIGN KEY ("sceneId") REFERENCES "SceneTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SceneTemplateProduct" ADD CONSTRAINT "SceneTemplateProduct_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BundleItem" ADD CONSTRAINT "BundleItem_bundleId_fkey" FOREIGN KEY ("bundleId") REFERENCES "Bundle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BundleItem" ADD CONSTRAINT "BundleItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuoteBundle" ADD CONSTRAINT "QuoteBundle_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "Quote"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuoteBundle" ADD CONSTRAINT "QuoteBundle_bundleId_fkey" FOREIGN KEY ("bundleId") REFERENCES "Bundle"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Room" ADD CONSTRAINT "Room_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "Quote"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Quote" ADD CONSTRAINT "Quote_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuoteItem" ADD CONSTRAINT "QuoteItem_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "Quote"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuoteItem" ADD CONSTRAINT "QuoteItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuoteItem" ADD CONSTRAINT "QuoteItem_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room"("id") ON DELETE SET NULL ON UPDATE CASCADE;
