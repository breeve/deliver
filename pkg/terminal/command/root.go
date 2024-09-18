package command

import (
	"github.com/spf13/cobra"
)

func rootCommand() (root *Command, err error) {
	var rootCmd = &cobra.Command{
		Use:   "app",
		Short: "",
		Long:  ``,
	}

	return &Command{
		cmd: rootCmd,
	}, nil
}
