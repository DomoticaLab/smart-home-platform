import { useReducer, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useToast } from '../components/ui'
import { useCreateQuote, useAddRoom, useAddItem, useAddBundle, useChangeStatus } from '../hooks/useQuotes'
import { useClient } from '../hooks/useClients'
import { WizardLayout } from '../components/quotes/wizard/WizardLayout'
import { Step1Client } from '../components/quotes/wizard/Step1Client'
import { Step2Rooms } from '../components/quotes/wizard/Step2Rooms'
import { Step3Products } from '../components/quotes/wizard/Step3Products'
import { Step4Summary } from '../components/quotes/wizard/Step4Summary'
import { Card } from '../components/ui/Card'
import type {
  WizardState,
  WizardAction,
  WIZARD_INITIAL_STATE,
  WizardStep,
  QuoteStatus
} from '../types/quote.types'

const STORAGE_KEY = 'quote-wizard-state'

function loadState(): WizardState {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as WizardState
      // Only restore if we have a client (wizard was started)
      if (parsed.clientId) return parsed
    }
  } catch {
    // ignore parse errors
  }
  return {
    step: 1,
    clientId: null,
    projectName: '',
    projectAddress: '',
    rooms: [],
    items: [],
    manualItems: [],
    bundles: []
  }
}

function saveState(state: WizardState) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    // ignore storage errors
  }
}

function reducer(state: WizardState, action: WizardAction): WizardState {
  switch (action.type) {
    case 'SET_CLIENT':
      return { ...state, clientId: action.clientId }
    case 'SET_PROJECT':
      return { ...state, projectName: action.name, projectAddress: action.address }
    case 'ADD_ROOM':
      return { ...state, rooms: [...state.rooms, action.room] }
    case 'REMOVE_ROOM':
      return { ...state, rooms: state.rooms.filter((_, i) => i !== action.index) }
    case 'ADD_ITEM':
      return { ...state, items: [...state.items, action.item] }
    case 'REMOVE_ITEM':
      return { ...state, items: state.items.filter((_, i) => i !== action.index) }
    case 'ADD_BUNDLE':
      return { ...state, bundles: [...state.bundles, action.bundle] }
    case 'REMOVE_BUNDLE':
      return { ...state, bundles: state.bundles.filter((_, i) => i !== action.index) }
    case 'SET_STEP':
      return { ...state, step: action.step }
    case 'RESET':
      return {
        step: 1,
        clientId: null,
        projectName: '',
        projectAddress: '',
        rooms: [],
        items: [],
        bundles: []
      }
    default:
      return state
  }
}

export default function QuoteWizardPage() {
  const navigate = useNavigate()
  const { toast } = useToast()

  const [state, dispatch] = useReducer(reducer, undefined, loadState)

  // Persist to sessionStorage on every change
  useEffect(() => {
    saveState(state)
  }, [state])

  const createQuoteMutation = useCreateQuote()
  const addRoomMutation = useAddRoom()
  const addItemMutation = useAddItem()
  const addBundleMutation = useAddBundle()
  const changeStatusMutation = useChangeStatus()

  // Fetch client name for step 4
  const { data: clientData } = useClient(state.clientId ?? '')
  const clientName = clientData?.name ?? 'Cliente'

  // Step validation
  const canAdvance = useCallback((): boolean => {
    switch (state.step) {
      case 1:
        return !!state.clientId
      case 2:
        return state.rooms.length >= 1
      case 3:
        return state.items.length > 0 || state.bundles.length > 0
      case 4:
        return true
      default:
        return false
    }
  }, [state])

  const handleNext = useCallback(() => {
    if (!canAdvance()) {
      toast.error('Completá los datos requeridos antes de continuar')
      return
    }
    const next = Math.min(state.step + 1, 4) as WizardStep
    dispatch({ type: 'SET_STEP', step: next })
  }, [state.step, canAdvance, toast])

  const handlePrev = useCallback(() => {
    const prev = Math.max(state.step - 1, 1) as WizardStep
    dispatch({ type: 'SET_STEP', step: prev })
  }, [state.step])

  const handleCreateQuote = useCallback(
    async (initialStatus: QuoteStatus) => {
      if (!state.clientId) return

      try {
        // 1. Create the quote
        const quote = await createQuoteMutation.mutateAsync({
          clientId: state.clientId,
          projectName: state.projectName || undefined,
          projectAddress: state.projectAddress || undefined
        })

        // 2. Add rooms
        for (const room of state.rooms) {
          await addRoomMutation.mutateAsync({
            quoteId: quote.id,
            data: { name: room.name, floor: room.floor, areaSqm: room.areaSqm }
          })
        }

        // 3. Add bundles
        for (const bundle of state.bundles) {
          await addBundleMutation.mutateAsync({
            quoteId: quote.id,
            data: { bundleId: bundle.bundleId, quantity: bundle.quantity }
          })
        }

        // 4. Add items (resolve room index to roomId from first room if not assigned)
        const firstRoomId = quote.rooms?.[0]?.id
        for (const item of state.items) {
          await addItemMutation.mutateAsync({
            quoteId: quote.id,
            data: {
              productId: item.productId,
              roomId: item.roomId ? firstRoomId : undefined,
              quantity: item.quantity,
              unitPrice: item.unitPrice
            }
          })
        }

        // 5. Add manual items (ítems que el cliente pidió fuera del catálogo)
        for (const item of state.manualItems) {
          await addItemMutation.mutateAsync({
            quoteId: quote.id,
            data: {
              customName: item.customName,
              customDescription: item.customDescription,
              roomId: item.roomId ? firstRoomId : undefined,
              quantity: item.quantity,
              unitPrice: item.unitPrice
            }
          })
        }

        // 6. Set initial status if not DRAFT
        if (initialStatus !== 'DRAFT') {
          await changeStatusMutation.mutateAsync({ quoteId: quote.id, status: initialStatus })
        }

        // 6. Clear session storage
        sessionStorage.removeItem(STORAGE_KEY)

        toast.success(`Cotización ${quote.quoteNumber} creada correctamente`)
        navigate(`/quotes/${quote.id}`)
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'No se pudo crear la cotización')
      }
    },
    [state, createQuoteMutation, addRoomMutation, addItemMutation, addBundleMutation, changeStatusMutation, navigate, toast]
  )

  const handleReset = useCallback(() => {
    dispatch({ type: 'RESET' })
    sessionStorage.removeItem(STORAGE_KEY)
  }, [])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-gold">Nuevo</p>
          <h1 className="text-2xl font-bold text-text-primary">Cotización</h1>
          <p className="mt-1 text-sm text-text-secondary">
            Completá los 4 pasos para generar la cotización.
          </p>
        </div>
        <button
          onClick={handleReset}
          className="text-sm text-text-secondary hover:text-red transition-colors"
        >
          Reiniciar wizard
        </button>
      </div>

      <WizardLayout
        currentStep={state.step}
        onPrev={handlePrev}
        onNext={handleNext}
        nextLabel={state.step === 4 ? 'Finalizar' : 'Siguiente'}
        nextDisabled={!canAdvance()}
        nextLoading={createQuoteMutation.isPending}
      >
        {state.step === 1 && (
          <Step1Client
            selectedClientId={state.clientId}
            onClientSelected={(clientId) => dispatch({ type: 'SET_CLIENT', clientId })}
          />
        )}

        {state.step === 2 && (
          <Step2Rooms
            quoteId={null}
            rooms={state.rooms}
            onRoomAdded={(room) => dispatch({ type: 'ADD_ROOM', room })}
            onRoomRemoved={(index) => dispatch({ type: 'REMOVE_ROOM', index })}
          />
        )}

        {state.step === 3 && (
          <Step3Products
            rooms={state.rooms}
            items={state.items}
            bundles={state.bundles}
            manualItems={state.manualItems}
            onItemAdded={(item) => dispatch({ type: 'ADD_ITEM', item })}
            onItemRemoved={(index) => dispatch({ type: 'REMOVE_ITEM', index })}
            onManualItemAdded={(item) => dispatch({ type: 'ADD_MANUAL_ITEM', item })}
            onManualItemRemoved={(index) => dispatch({ type: 'REMOVE_MANUAL_ITEM', index })}
            onBundleAdded={(bundle) => dispatch({ type: 'ADD_BUNDLE', bundle })}
            onBundleRemoved={(index) => dispatch({ type: 'REMOVE_BUNDLE', index })}
          />
        )}

        {state.step === 4 && (
          <Step4Summary
            clientName={clientName}
            projectName={state.projectName}
            rooms={state.rooms}
            items={state.items}
            manualItems={state.manualItems}
            bundles={state.bundles}
            onCreateQuote={handleCreateQuote}
            isCreating={createQuoteMutation.isPending}
          />
        )}
      </WizardLayout>
    </div>
  )
}