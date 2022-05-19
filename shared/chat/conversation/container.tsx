import * as React from 'react'
import * as Constants from '../../constants/chat2'
import * as Container from '../../util/container'
import Normal from './normal/container'
import NoConversation from './no-conversation'
import Error from './error/container'
import YouAreReset from './you-are-reset'
import Rekey from './rekey/container'
import {headerNavigationOptions} from './header-area/container'
import {useFocusEffect, useNavigation} from '@react-navigation/core'
import {tabBarStyle} from '../../router-v2/common'
import type {RouteProps} from '../../router-v2/route-params'

type ConvoType = 'error' | 'noConvo' | 'rekey' | 'youAreReset' | 'normal' | 'rekey'

type SwitchProps = RouteProps<'chatConversation'>
const hideTabBarStyle = {display: 'none'}

// due to timing issues if we go between convos we can 'lose track' of focus in / out
// so instead we keep a count and only bring back the tab if we're entirely gone
let focusRefCount = 0

let showDeferId: any = 0
const deferChangeTabOptions = (tabNav, tabBarStyle, defer) => {
  if (showDeferId) {
    clearTimeout(showDeferId)
  }
  if (tabNav) {
    if (defer) {
      showDeferId = setTimeout(() => {
        tabNav.setOptions({tabBarStyle})
      }, 1)
    } else {
      tabNav.setOptions({tabBarStyle})
    }
  }
}

const Conversation = (p: SwitchProps) => {
  const navigation = useNavigation()
  let tabNav: any = navigation.getParent()
  if (tabNav?.getState()?.type !== 'tab') {
    tabNav = undefined
  }

  useFocusEffect(
    React.useCallback(() => {
      if (!Container.isPhone) {
        return
      }
      ++focusRefCount
      deferChangeTabOptions(tabNav, hideTabBarStyle, false)
      return () => {
        --focusRefCount
        if (focusRefCount === 0) {
          deferChangeTabOptions(tabNav, tabBarStyle, true)
        }
      }
    }, [tabNav])
  )

  const conversationIDKey = p.route.params?.conversationIDKey ?? Constants.noConversationIDKey
  const meta = Container.useSelector(state => Constants.getMeta(state, conversationIDKey))

  let type: ConvoType
  switch (conversationIDKey) {
    case Constants.noConversationIDKey:
      type = 'noConvo'
      break
    default:
      if (meta.membershipType === 'youAreReset') {
        type = 'youAreReset'
      } else if (meta.rekeyers.size > 0) {
        type = 'rekey'
      } else if (meta.trustedState === 'error') {
        type = 'error'
      } else {
        type = 'normal'
      }
  }

  switch (type) {
    case 'error':
      return <Error key={conversationIDKey} conversationIDKey={conversationIDKey} />
    case 'noConvo':
      // When navigating back to the inbox on mobile, we deselect
      // conversationIDKey by called mobileChangeSelection. This results in
      // the conversation view rendering "NoConversation" as it is
      // transitioning back the the inbox.
      // On android this is very noticeable because transitions fade between
      // screens, so "NoConversation" will appear on top of the inbox for
      // approximately 150ms.
      // On iOS it is less noticeable because screen transitions slide away to
      // the right, though it is visible for a small amount of time.
      // To solve this we render a blank screen on mobile conversation views with "noConvo"
      return Container.isPhone ? null : <NoConversation />
    case 'normal':
      // the id as key is so we entirely force a top down redraw to ensure nothing is possibly from another convo
      return <Normal key={conversationIDKey} conversationIDKey={conversationIDKey} />
    case 'youAreReset':
      return <YouAreReset />
    case 'rekey':
      return <Rekey key={conversationIDKey} conversationIDKey={conversationIDKey} />
    default:
      return <NoConversation />
  }
}

// @ts-ignore
Conversation.navigationOptions = ({route}) => ({
  ...headerNavigationOptions(route),
  needsSafe: true,
})

const ConversationMemoed = React.memo(Conversation)
Container.hoistNonReactStatic(ConversationMemoed, Conversation)

export default ConversationMemoed
