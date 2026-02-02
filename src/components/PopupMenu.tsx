import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Dimensions,
} from 'react-native';

interface Action {
  label: string;
  onPress: () => void;
  color?: string;
  isDestructive?: boolean;
}

interface PopupMenuProps {
  visible: boolean;
  onClose: () => void;
  actions: Action[];
  title?: string;
}

const PopupMenu: React.FC<PopupMenuProps> = ({ visible, onClose, actions, title }) => {
  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <View style={styles.menuContainer}>
            {title && (
              <View style={styles.titleContainer}>
                <Text style={styles.titleText}>{title}</Text>
              </View>
            )}
            {actions.map((action, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.menuItem,
                  index === actions.length - 1 && styles.lastItem,
                ]}
                onPress={() => {
                  onClose();
                  action.onPress();
                }}
              >
                <Text
                  style={[
                    styles.menuItemText,
                    { color: action.isDestructive ? '#d32f2f' : action.color || '#333' },
                  ]}
                >
                  {action.label}
                </Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuContainer: {
    width: Dimensions.get('window').width * 0.8,
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
  },
  titleContainer: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    alignItems: 'center',
  },
  titleText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  menuItem: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    alignItems: 'center',
  },
  lastItem: {
    borderBottomWidth: 0,
  },
  menuItemText: {
    fontSize: 17,
    fontWeight: '500',
  },
  cancelButton: {
    paddingVertical: 16,
    backgroundColor: '#f9f9f9',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 17,
    color: '#666',
    fontWeight: '600',
  },
});

export default PopupMenu;
