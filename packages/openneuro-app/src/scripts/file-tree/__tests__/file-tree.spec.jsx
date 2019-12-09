import React from 'react'
import { mount } from 'enzyme'
import { ApolloProvider } from 'react-apollo'
import FileTree, {
  sortByFilename,
  sortByName,
  unescapePath,
} from '../file-tree.jsx'

describe('FileTree component', () => {
  it('renders with default props', () => {
    expect(mount(<FileTree />)).toMatchSnapshot()
  })
  it('expands and closes when clicked', () => {
    // ApolloProvider isn't used in this test but must exist
    // When enzyme supports hooks, this can be simplified
    const wrapper = mount(
      <ApolloProvider client={{}}>
        <FileTree name="Top Level" />
      </ApolloProvider>,
    )
    expect(
      wrapper
        .find('button.btn-file-folder > i.type-icon')
        .hasClass('fa-folder-open'),
    ).toBe(true)
    wrapper.find('button').simulate('click')
    expect(
      wrapper
        .find('button.btn-file-folder > i.type-icon')
        .hasClass('fa-folder-open'),
    ).toBe(false)
    wrapper.find('button').simulate('click')
    expect(
      wrapper
        .find('button.btn-file-folder > i.type-icon')
        .hasClass('fa-folder-open'),
    ).toBe(true)
  })
  describe('sortByFilename()', () => {
    it('sorts the expected filename properties', () => {
      expect(
        sortByFilename(
          { name: 'abc', filename: 'xyz' },
          { name: 'xyz', filename: 'abc' },
        ),
      ).toBe(1)
    })
  })
  describe('sortByName()', () => {
    it('sorts the expected name properties', () => {
      expect(
        sortByName(
          { name: 'abc', filename: 'xyz' },
          { name: 'xyz', filename: 'abc' },
        ),
      ).toBe(-1)
    })
  })
  describe('unescapePath()', () => {
    it('does not alter an already escaped path', () => {
      expect(unescapePath('sub-01/anat')).toBe('sub-01/anat')
    })
    it('does unescapes any : characters', () => {
      expect(unescapePath('sub-01:anat')).toBe('sub-01/anat')
    })
    it('unescapes multiple : characters', () => {
      expect(unescapePath('sub-01:anat:image.nii.gz')).toBe(
        'sub-01/anat/image.nii.gz',
      )
    })
  })
})
